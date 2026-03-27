import base64
import io
import os
import re
import tempfile
from typing import Literal

from gtts import gTTS


def _normalize_language(language: str) -> Literal["ta", "hi", "en"]:
    lang = (language or "").strip().lower()
    if lang in ["ta", "tamil"]:
        return "ta"
    if lang in ["hi", "hindi"]:
        return "hi"
    return "en"


def _clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


def detect_intent(text: str, language: str) -> str:
    t = (text or "").lower()

    # Minimal keyword-based intent detection (production can be replaced by LLM classifier).
    if any(k in t for k in ["balance", "available", "amount", "account balance", "saldo", "balance amount"]):
        return "balance"
    if any(k in t for k in ["transaction", "transactions", "statement", "history", "last 5", "recent"]):
        return "transactions"
    if any(k in t for k in ["transfer", "send", "payment", "pay"]):
        return "transfer"

    # Very lightweight language hints (optional).
    if language.startswith("ta") and any(k in t for k in ["இருப்பு", "வங்கி", "பரிவர்த்தனை"]):
        return "balance" if "இருப்பு" in t else "transactions"
    if language.startswith("hi") and any(k in t for k in ["बैलेंस", "लेनदेन", "खाता", "स्टेटमेंट"]):
        if "बैलेंस" in t or "खाता" in t:
            return "balance"
        return "transactions"

    return "general"


def build_response_text(intent: str, *, language: str, balance: float | None, transactions: list[dict]) -> str:
    lang_code = _normalize_language(language)

    if intent == "balance":
        if balance is None:
            return {
                "ta": "மன்னிக்கவும். உங்கள் கணக்கின் இருப்புத் தொகை கிடைக்கவில்லை.",
                "hi": "माफ़ कीजिए, आपके खाते का बैलेंस उपलब्ध नहीं है।",
                "en": "Sorry, your account balance is not available.",
            }[lang_code]
        return {
            "ta": f"உங்கள் இருப்புத் தொகை {balance:.2f} {('INR' if lang_code=='en' else 'INR')} ஆகும்.",
            "hi": f"आपका बैलेंस {balance:.2f} INR है।",
            "en": f"Your available balance is {balance:.2f} INR.",
        }[lang_code]

    if intent == "transactions":
        if not transactions:
            return {
                "ta": "சமீபத்திய பரிவர்த்தனைகள் எதுவும் இல்லை.",
                "hi": "कोई हालिया लेनदेन नहीं मिला।",
                "en": "No recent transactions found.",
            }[lang_code]

        lines = []
        for tx in transactions[:5]:
            # tx fields: type, amount, description, date
            amt = float(tx.get("amount", 0))
            typ = tx.get("type", "")
            desc = tx.get("description") or ""
            date = tx.get("date")
            date_str = str(date)[:10] if date else ""
            lines.append(f"- {typ} {amt:.2f} INR{(' ('+desc+')') if desc else ''}{(' ['+date_str+']') if date_str else ''}")

        return {
            "ta": "இங்கே உங்கள் சமீபத்திய பரிவர்த்தனைகள்:\n" + "\n".join(lines),
            "hi": "आपके हालिया लेनदेन:\n" + "\n".join(lines),
            "en": "Here are your recent transactions:\n" + "\n".join(lines),
        }[lang_code]

    # transfer/general
    return {
      "ta": "நான் உதவ முடியும். உங்கள் கோரிக்கையை மீண்டும் சொல்லுங்கள் (பாலன்ஸ் அல்லது பரிவர்த்தனைகள்).",
      "hi": "मैं मदद कर सकता हूँ। कृपया अपना अनुरोध दोहराएँ (बैलेंस या लेनदेन)।",
      "en": "I can help. Please tell me what you need (balance or transactions).",
    }[_normalize_language(language)]


def maybe_generate_with_llm(*, prompt: str, language: str) -> str:
    """
    Optional LLM generation. Keeps repo runnable by lazily importing HF/LangChain.
    Enable with env `USE_LLM=true` and optionally `HF_MODEL=...`.
    """
    use_llm = (os.getenv("USE_LLM") or "").lower() == "true"
    if not use_llm:
        return ""

    model_name = os.getenv("HF_MODEL") or "google/flan-t5-small"

    try:
        # HuggingFace Transformers (lazy import)
        from transformers import pipeline  # type: ignore

        gen = pipeline("text2text-generation", model=model_name)
        out = gen(prompt, max_new_tokens=120)
        if isinstance(out, list) and out:
            first = out[0] or {}
            text = first.get("generated_text")
            if text:
                return str(text).strip()
    except Exception:
        pass

    # LangChain can be plugged in similarly; omitted in fallback path.
    return ""


def synthesize_tts_mp3_base64(text: str, language: str) -> str:
    lang_code = _normalize_language(language)
    tts = gTTS(text=text, lang=lang_code)
    buf = io.BytesIO()
    # gTTS writes to file-like objects
    tts.write_to_fp(buf)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def transcribe_with_whisper(audio_bytes: bytes, *, language: str, audio_mime: str | None = None) -> str:
    """
    Whisper ASR is implemented with lazy imports.
    If Whisper (and its runtime deps like ffmpeg/torch) are missing, this will raise.
    """

    # Lazy load to avoid hard dependency during frontend-only demos.
    import whisper  # type: ignore

    # Whisper expects a filepath.
    # Use a best-effort extension to help ffmpeg/whisper decode correctly.
    suffix = ".wav"
    if audio_mime:
        if "webm" in audio_mime:
            suffix = ".webm"
        elif "ogg" in audio_mime:
            suffix = ".ogg"
        elif "mpeg" in audio_mime or "mp3" in audio_mime:
            suffix = ".mp3"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as f:
        f.write(audio_bytes)
        f.flush()
        # Whisper language hints are best-effort.
        lang_code = _normalize_language(language)
        # Mapping for whisper: 'en' works; for ta/hi best-effort.
        whisper_lang = {"en": "en", "hi": "hi", "ta": "ta"}.get(lang_code, None)
        model = whisper.load_model(os.getenv("WHISPER_MODEL", "base"))
        result = model.transcribe(f.name, language=whisper_lang)
        return _clean_text(result.get("text") or "")


async def process_voice_request(
    *,
    db,
    user_id: str,
    language: str,
    audio_bytes: bytes | None,
    audio_mime: str | None,
    transcript_text: str | None,
):
    lang_code = _normalize_language(language)

    transcript = _clean_text(transcript_text or "")
    detected_intent = None

    # 1) Voice -> text (Whisper when transcript isn't provided).
    if not transcript and audio_bytes:
        try:
            transcript = transcribe_with_whisper(audio_bytes, language=lang_code, audio_mime=audio_mime)
        except Exception:
            # Production: return a 4xx/5xx with actionable error.
            transcript = ""

    if not transcript:
        transcript = {
            "ta": "உங்கள் குரலை உரையாக மாற்ற முடியவில்லை.",
            "hi": "आपकी आवाज़ को टेक्स्ट में बदलने में समस्या हुई।",
            "en": "I couldn't transcribe your audio.",
        }[lang_code]

    # 2) Intent detection
    detected_intent = detect_intent(transcript, lang_code)

    # 3) Fetch relevant data from MongoDB
    balance = None
    transactions: list[dict] = []
    if detected_intent == "balance":
        accounts_col = db["accounts"]
        account = await accounts_col.find_one({"user_id": user_id})
        if account:
            balance = float(account.get("balance", 0.0))
    elif detected_intent == "transactions":
        tx_col = db["transactions"]
        cursor = (
            tx_col.find({"user_id": user_id})
            .sort("date", -1)
            .limit(5)
        )
        docs = await cursor.to_list(length=5)
        transactions = [
            {
                "type": d.get("type"),
                "amount": d.get("amount", 0),
                "description": d.get("description"),
                "date": d.get("date"),
            }
            for d in docs
        ]
    else:
        # For general/transfer, we try to show balance as a default.
        accounts_col = db["accounts"]
        account = await accounts_col.find_one({"user_id": user_id})
        if account:
            balance = float(account.get("balance", 0.0))

    # 4) Generate response text (rule-based + optional LLM)
    base_text = build_response_text(
        detected_intent, language=lang_code, balance=balance, transactions=transactions
    )
    llm_prompt = (
        "You are a multilingual banking customer support assistant. "
        "Respond politely and clearly in the same language as the user. "
        f"User transcript: {transcript}\n"
        f"Detected intent: {detected_intent}\n"
        f"Account balance: {balance}\n"
        f"Recent transactions: {transactions}\n"
        f"Draft response: {base_text}\n\n"
        "Rewrite the draft as the final response:"
    )
    response_text = base_text
    llm_text = maybe_generate_with_llm(prompt=llm_prompt, language=lang_code)
    if llm_text:
        response_text = llm_text

    # 5) Text -> speech (gTTS)
    audio_base64 = synthesize_tts_mp3_base64(response_text, lang_code)

    return {
        "text": response_text,
        "audio_base64": audio_base64,
        "audio_mime": "audio/mpeg",
        "detected_intent": detected_intent,
        "transcript": transcript,
    }

