"""Curated demo knowledge base.

Every source below is a real, official Government of India / international
health authority domain. Every document is a careful, general paraphrase of
well-established public information — not a live crawl, and not a specific
fabricated article URL. This is clearly a hackathon demo corpus, not a
production crawler; see README for how to point it at a live pipeline.
"""
import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Document, DocumentChunk, Source
from app.providers.embeddings.local_embedding import LocalHashingEmbeddingProvider

SOURCES = [
    {
        "key": "pmkisan",
        "name": "PM-KISAN — Ministry of Agriculture & Farmers Welfare",
        "domain": "pmkisan.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Pradhan Mantri Kisan Samman Nidhi farmer income-support scheme.",
    },
    {
        "key": "rbi",
        "name": "Reserve Bank of India",
        "domain": "rbi.org.in",
        "category": "BANKING",
        "authority_level": "AUTHORITATIVE",
        "description": "India's central bank and banking regulator.",
    },
    {
        "key": "pib",
        "name": "Press Information Bureau (Fact Check Unit)",
        "domain": "pib.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Government of India's official information dissemination and fact-check agency.",
    },
    {
        "key": "mohfw",
        "name": "Ministry of Health & Family Welfare",
        "domain": "mohfw.gov.in",
        "category": "HEALTHCARE",
        "authority_level": "AUTHORITATIVE",
        "description": "Union ministry responsible for health policy and public health guidance.",
    },
    {
        "key": "uidai",
        "name": "UIDAI (Aadhaar)",
        "domain": "uidai.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Unique Identification Authority of India, issuer of Aadhaar.",
    },
    {
        "key": "cybercrime",
        "name": "Indian Cyber Crime Coordination Centre (I4C)",
        "domain": "cybercrime.gov.in",
        "category": "EMERGENCY",
        "authority_level": "AUTHORITATIVE",
        "description": "National Cyber Crime Reporting Portal.",
    },
    {
        "key": "scholarships",
        "name": "National Scholarship Portal",
        "domain": "scholarships.gov.in",
        "category": "EDUCATION",
        "authority_level": "AUTHORITATIVE",
        "description": "Government of India's unified portal for student scholarship schemes.",
    },
    {
        "key": "education",
        "name": "Department of School Education & Literacy",
        "domain": "education.gov.in",
        "category": "EDUCATION",
        "authority_level": "AUTHORITATIVE",
        "description": "Union ministry department overseeing school education policy in India.",
    },
    {
        "key": "who",
        "name": "World Health Organization",
        "domain": "who.int",
        "category": "HEALTHCARE",
        "authority_level": "AUTHORITATIVE",
        "description": "United Nations specialized agency for international public health.",
    },
]

DOCUMENTS = [
    {
        "source_key": "pmkisan",
        "title": "PM-KISAN benefit amount and eligibility",
        "url": "https://pmkisan.gov.in/",
        "language": "en-IN",
        "content": (
            "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) provides eligible small and marginal farmer "
            "families an income support of ₹6,000 per year, paid in three equal installments of ₹2,000 "
            "every four months, directly to their bank accounts. Institutional landholders, government "
            "employees in specified posts, and income-tax payers are excluded from the scheme."
        ),
    },
    {
        "source_key": "rbi",
        "title": "Currency notes remain legal tender unless RBI announces otherwise",
        "url": "https://www.rbi.org.in/",
        "language": "en-IN",
        "content": (
            "The Reserve Bank of India has clarified that currency notes already in circulation, including "
            "₹500 notes issued by RBI, continue to be legal tender unless RBI specifically announces their "
            "withdrawal through an official press release. The public should verify any claim about currency "
            "withdrawal or a ban only through official RBI communications, not through forwarded messages."
        ),
    },
    {
        "source_key": "rbi",
        "title": "Lottery and prize-money fraud warning",
        "url": "https://www.rbi.org.in/",
        "language": "en-IN",
        "content": (
            "RBI and consumer protection authorities have repeatedly warned that legitimate lotteries, prize "
            "schemes, or bank refunds never require the winner to pay a processing fee, tax, or unlock charge "
            "in advance to release winnings. Messages asking for upfront payment to claim a prize are a common "
            "financial fraud pattern; the public should never share OTP, PIN, or bank details with unknown "
            "callers or messages."
        ),
    },
    {
        "source_key": "mohfw",
        "title": "No home remedy is a proven cure for viral infections like COVID-19",
        "url": "https://www.mohfw.gov.in/",
        "language": "en-IN",
        "content": (
            "The Ministry of Health and Family Welfare has stated that no home remedy, such as consuming hot "
            "water, herbal concoctions, or specific foods, has been scientifically proven to cure COVID-19 or "
            "similar viral infections. The Ministry advises following medically approved preventive measures "
            "and consulting a registered doctor for treatment, and cautions the public against unverified "
            "cures circulated on social media and messaging apps."
        ),
    },
    {
        "source_key": "uidai",
        "title": "Aadhaar does not expire or become invalid due to non-linking with PAN",
        "url": "https://uidai.gov.in/",
        "language": "en-IN",
        "content": (
            "UIDAI has clarified that an Aadhaar number, once issued, does not have an expiry date and does "
            "not become invalid merely because it has not been linked with PAN. Separately, the Income Tax "
            "Department requires PAN to be linked with Aadhaar for the PAN itself to remain operative for "
            "income-tax purposes — that is a PAN-related requirement, not an Aadhaar cancellation."
        ),
    },
    {
        "source_key": "cybercrime",
        "title": "How to report suspicious messages and financial fraud",
        "url": "https://www.cybercrime.gov.in/",
        "language": "en-IN",
        "content": (
            "The Indian Cyber Crime Coordination Centre (I4C) operates the National Cyber Crime Reporting "
            "Portal for citizens to report financial fraud, phishing links, and fake job or lottery messages. "
            "Citizens are advised never to click on unknown links or share banking OTPs, and to report "
            "suspicious messages immediately through the official portal or the 1930 helpline."
        ),
    },
    {
        "source_key": "scholarships",
        "title": "National Means-cum-Merit Scholarship Scheme (NMMSS) amount and eligibility",
        "url": "https://scholarships.gov.in/",
        "language": "en-IN",
        "content": (
            "Under the National Means-cum-Merit Scholarship Scheme (NMMSS), selected economically weaker "
            "meritorious students studying in classes 9 to 12 in government and government-aided schools "
            "receive a scholarship of ₹12,000 per year (₹1,000 per month), awarded through a means-cum-merit "
            "selection test — not as a universal payment made to every student in the country."
        ),
    },
    {
        "source_key": "education",
        "title": "Board examination policy changes require official notification",
        "url": "https://www.education.gov.in/",
        "language": "en-IN",
        "content": (
            "Changes to the structure or mandatory nature of Class 10 and Class 12 board examinations are "
            "announced only through official notifications from the Department of School Education and "
            "Literacy or the respective State or Central education boards such as CBSE. No general "
            "announcement has made board examinations entirely optional nationwide; claims to this effect "
            "circulating on social media should be verified against the official board's own notification."
        ),
    },
    {
        "source_key": "pib",
        "title": "PIB Fact Check verifies viral claims about government schemes",
        "url": "https://pib.gov.in/",
        "language": "en-IN",
        "content": (
            "The Press Information Bureau's Fact Check unit exists specifically to verify viral claims about "
            "government schemes, policies, and announcements circulating on social media and messaging "
            "platforms. Citizens are encouraged to cross-check any message claiming a new government scheme, "
            "cash transfer, or benefit against the concerned ministry's official website before believing or "
            "forwarding it."
        ),
    },
    {
        "source_key": "who",
        "title": "Rely on official health authorities, not unverified home remedies",
        "url": "https://www.who.int/",
        "language": "en-IN",
        "content": (
            "The World Health Organization advises the public to rely on information from national health "
            "authorities and WHO's official communications regarding disease prevention and treatment, and "
            "cautions against unverified home remedies or miracle cures shared through social media and "
            "messaging apps, which can cause harm or delay proper medical care."
        ),
    },
]

DEMO_CLAIMS = [
    {
        "claim": "PM-KISAN gives eligible small farmer families ₹6,000 per year in three installments.",
        "category": "Government scheme",
        "expected_verdict": "VERIFIED",
    },
    {
        "claim": "Government is giving ₹10,000 to every student under a new scholarship scheme.",
        "category": "Education",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "You have won a ₹25 lakh lottery prize — pay a ₹5,000 processing fee to claim it.",
        "category": "Financial scam",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "Drinking hot water with turmeric every morning completely cures COVID-19.",
        "category": "Healthcare claim",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "Your Aadhaar card will become invalid if it is not linked with PAN by the deadline.",
        "category": "Government scheme",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "The government has made Class 10 board exams completely optional for all students.",
        "category": "Education",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "The government has announced a new toll-free helpline 14545 for farmers to report crop damage from wild animals.",
        "category": "Public service",
        "expected_verdict": "UNVERIFIED",
    },
]


def seed_if_empty(db: Session) -> None:
    if db.query(Source).count() > 0:
        return

    embedder = LocalHashingEmbeddingProvider()
    now = datetime.now(timezone.utc)

    sources_by_key = {}
    for spec in SOURCES:
        source = Source(
            name=spec["name"],
            domain=spec["domain"],
            category=spec["category"],
            authority_level=spec["authority_level"],
            description=spec["description"],
            verification_status="ACTIVE",
            last_checked=now,
            allowed_for_verification=True,
            active=True,
        )
        db.add(source)
        db.flush()
        sources_by_key[spec["key"]] = source

    for doc_spec in DOCUMENTS:
        source = sources_by_key[doc_spec["source_key"]]
        document = Document(
            source_id=source.id,
            title=doc_spec["title"],
            url=doc_spec["url"],
            published_at=now,
            retrieved_at=now,
            language=doc_spec["language"],
            content_hash="",
        )
        db.add(document)
        db.flush()

        embedding = embedder.embed(doc_spec["content"])
        chunk = DocumentChunk(
            document_id=document.id,
            source_id=source.id,
            content=doc_spec["content"],
            embedding=json.dumps(embedding),
            chunk_index=0,
            language=doc_spec["language"],
        )
        db.add(chunk)

    db.commit()
