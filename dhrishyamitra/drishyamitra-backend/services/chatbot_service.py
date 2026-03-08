import os

from groq import Groq


class ChatbotService:
    def __init__(self, api_key: str = "", model: str = "llama-3.1-8b-instant") -> None:
        self.model = model
        key = api_key or os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=key) if key else None

    def ask(self, message: str, context: str | None = None) -> dict:
        if not self.client:
            return {
                "bot_response": "Groq is not configured. Set GROQ_API_KEY to enable AI chat.",
                "engine": "fallback",
            }

        prompt = message if not context else f"Context: {context}\n\nUser: {message}"

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )

        return {
            "bot_response": response.choices[0].message.content,
            "engine": "groq",
        }
