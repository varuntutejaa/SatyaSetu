import unittest
from xml.etree import ElementTree

from app.services.twilio_ivr import (
    DIGIT_TO_LANGUAGE,
    SUPPORTED_LANGUAGE_CODES,
    build_claim_prompt_twiml,
    build_result_twiml,
    build_welcome_twiml,
    get_language,
)


class TwilioIVRTests(unittest.TestCase):
    def test_welcome_menu_collects_one_digit(self):
        root = ElementTree.fromstring(build_welcome_twiml())
        gather = root.find("Gather")
        self.assertIsNotNone(gather)
        self.assertEqual(gather.attrib["input"], "dtmf")
        self.assertEqual(gather.attrib["numDigits"], "1")
        self.assertEqual(gather.attrib["action"], "/api/ivr/language")
        self.assertEqual(len(gather.findall("Say")), len(SUPPORTED_LANGUAGE_CODES) + 1)
        self.assertEqual(DIGIT_TO_LANGUAGE["#"], "en-IN")
        self.assertEqual(DIGIT_TO_LANGUAGE["0"], "od-IN")

    def test_punjabi_uses_distinct_speech_and_voice_locales(self):
        root = ElementTree.fromstring(build_claim_prompt_twiml(get_language("pa-IN")))
        gather = root.find("Gather")
        self.assertEqual(gather.attrib["language"], "pa-guru-IN")
        prompt = gather.find("Say")
        self.assertEqual(prompt.attrib["language"], "pa-IN")
        self.assertEqual(prompt.attrib["voice"], "Google.pa-IN-Standard-A")

    def test_result_explains_verdict_and_offers_another_check(self):
        result = {
            "verdict": "CONTRADICTED",
            "sourceCount": 2,
            "evidence": [{"category": "financial_safety"}],
        }
        root = ElementTree.fromstring(build_result_twiml(result, get_language("en-IN")))
        spoken = " ".join((element.text or "") for element in root.findall("Say"))
        self.assertIn("conflicts with reliable official evidence", spoken)
        self.assertIn("1 9 3 0", spoken)
        gather = root.find("Gather")
        self.assertEqual(gather.attrib["action"], "/api/ivr/restart?lang=en-IN")


if __name__ == "__main__":
    unittest.main()
