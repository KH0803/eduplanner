# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import anthropic
import json
import os
import base64
from pathlib import Path

BASE_DIR = Path(__file__).parent

# .env 파일에서 API 키 읽기 (로컬 개발용)
env_path = BASE_DIR / '.env'
if env_path.exists():
    for line in env_path.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

app = Flask(__name__, static_folder=str(BASE_DIR / 'dist'), static_url_path='')
app.config['JSON_AS_ASCII'] = False
CORS(app)

def json_response(data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    return Response(body, status=status, content_type='application/json; charset=utf-8')

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

FEEDBACK_SYSTEM = """당신은 대한민국 사범대학의 교육학 교수입니다.
가네(Gagné)의 9가지 수업 사태 이론을 깊이 이해하고, 예비교사 교육을 20년 이상 담당한 전문가입니다.
학생의 수업지도안을 정밀하게 분석하여 구체적이고 건설적인 피드백을 제공하세요.
반드시 JSON 형식으로만 응답하세요."""

ANALYSIS_SYSTEM = """당신은 대한민국의 교육과정 전문가입니다.
2022 개정 교육과정을 포함한 국가 교육과정 문서 분석에 정통합니다.
제공된 교육과정 내용을 분석하여 핵심 역량, 성취기준, 교수학습 방법, 평가 유의사항을 정리하세요.
반드시 JSON 형식으로만 응답하세요."""

EVENT_NAMES = [
    "1. 주의 집중 시키기",
    "2. 학습자에게 목표 알리기",
    "3. 선수학습 회상 자극하기",
    "4. 자극 제시하기",
    "5. 학습 안내 제공하기",
    "6. 수행 유도하기",
    "7. 피드백 제공하기",
    "8. 수행 평가하기",
    "9. 파지 및 전이 강화하기",
]


def build_claude_content(plan):
    """첨부파일 포함한 Claude messages content 구성"""
    events = plan.get('events', {})
    attachments = plan.get('attachments', [])

    text_prompt = f"""다음은 예비교사가 '가네의 9가지 수업 사태' 이론에 기반하여 작성한 수업지도안입니다.

수업지도안:
- 과목: {plan.get('subject', '')}
- 대상 학년: {plan.get('grade', '')}
- 수업 주제: {plan.get('topic', '')}
- 학습 목표: {', '.join(plan.get('objectives', []))}

가네의 9가지 수업 사태:
1. 주의 집중 시키기: {events.get('gainingAttention', '')}
2. 학습자에게 목표 알리기: {events.get('informingLearners', '')}
3. 선수학습 회상 자극하기: {events.get('stimulatingRecall', '')}
4. 자극 제시하기: {events.get('presentingStimulus', '')}
5. 학습 안내 제공하기: {events.get('providingGuidance', '')}
6. 수행 유도하기: {events.get('elicitingPerformance', '')}
7. 피드백 제공하기: {events.get('providingFeedback', '')}
8. 수행 평가하기: {events.get('assessingPerformance', '')}
9. 파지 및 전이 강화하기: {events.get('enhancingRetention', '')}
"""

    # 텍스트 첨부파일 내용 추가
    text_attachments = []
    image_contents = []
    for att in attachments:
        if att.get('type', '').startswith('text/') or att.get('type') == 'application/json':
            text_attachments.append(f"\n[첨부파일: {att['name']}]\n{att.get('content', '')}")
        elif att.get('type', '').startswith('image/') and att.get('content', '').startswith('data:'):
            # base64 이미지
            header, b64data = att['content'].split(',', 1)
            media_type = att['type']
            image_contents.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": b64data,
                }
            })

    if text_attachments:
        text_prompt += "\n첨부 자료 내용:" + ''.join(text_attachments)

    text_prompt += """

다음 JSON 형식으로 피드백을 제공하세요:
{
  "score": 100점 만점 점수(숫자),
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "overall": "교수님 관점의 최종 총평 (2-3문장)",
  "eventFeedbacks": [
    {"event": "1. 주의 집중 시키기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "2. 학습자에게 목표 알리기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "3. 선수학습 회상 자극하기", "rating": "missing", "comment": "구체적 코멘트"},
    {"event": "4. 자극 제시하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "5. 학습 안내 제공하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "6. 수행 유도하기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "7. 피드백 제공하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "8. 수행 평가하기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "9. 파지 및 전이 강화하기", "rating": "good", "comment": "구체적 코멘트"}
  ]
}
rating 값은 반드시 "good"(잘 됨), "needs_work"(보완 필요), "missing"(미작성) 중 하나여야 합니다."""

    content = image_contents + [{"type": "text", "text": text_prompt}]
    return content


def extract_json(text):
    text = text.strip()
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0].strip()
    elif '```' in text:
        text = text.split('```')[1].split('```')[0].strip()
    return json.loads(text)


@app.route('/api/feedback', methods=['POST'])
def get_feedback():
    plan = request.get_json(force=True)
    try:
        content = build_claude_content(plan)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            system=FEEDBACK_SYSTEM,
            messages=[{"role": "user", "content": content}]
        )
        return json_response(extract_json(message.content[0].text))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json_response({'error': str(e)}, 500)


@app.route('/api/analyze', methods=['POST'])
def analyze_curriculum():
    text = request.json.get('text', '')
    prompt = f"""다음 교육과정 내용을 분석해주세요:

{text}

다음 JSON 형식으로 응답하세요:
{{
  "keyCompetencies": ["핵심역량1", "핵심역량2"],
  "achievementStandards": ["성취기준1", "성취기준2"],
  "teachingSuggestions": ["교수학습방법1", "교수학습방법2"],
  "evaluationPoints": ["평가유의사항1", "평가유의사항2"]
}}"""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=ANALYSIS_SYSTEM,
            messages=[{"role": "user", "content": prompt}]
        )
        return json_response(extract_json(message.content[0].text))
    except Exception as e:
        return json_response({'error': str(e)}, 500)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    dist = str(BASE_DIR / 'dist')
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    return send_from_directory(dist, 'index.html')


if __name__ == '__main__':
    print("✅ 에듀플래너 서버 실행 중 → http://localhost:5002")
    app.run(debug=False, port=5002)
