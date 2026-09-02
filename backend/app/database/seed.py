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
    {
        "key": "pmjay",
        "name": "Ayushman Bharat PM-JAY — National Health Authority",
        "domain": "pmjay.gov.in",
        "category": "HEALTHCARE",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Ayushman Bharat Pradhan Mantri Jan Arogya Yojana health insurance scheme.",
    },
    {
        "key": "pmaymis",
        "name": "PM Awas Yojana — Ministry of Housing & Urban Affairs",
        "domain": "pmaymis.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Pradhan Mantri Awas Yojana affordable-housing scheme.",
    },
    {
        "key": "pmjdy",
        "name": "PM Jan-Dhan Yojana — Department of Financial Services",
        "domain": "pmjdy.gov.in",
        "category": "BANKING",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Pradhan Mantri Jan-Dhan Yojana financial-inclusion scheme.",
    },
    {
        "key": "nrega",
        "name": "MGNREGA — Ministry of Rural Development",
        "domain": "nrega.nic.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Mahatma Gandhi National Rural Employment Guarantee Act.",
    },
    {
        "key": "mudra",
        "name": "Pradhan Mantri MUDRA Yojana",
        "domain": "mudra.org.in",
        "category": "FINANCE",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for collateral-free micro-enterprise loans under PMMY.",
    },
    {
        "key": "pmkvy",
        "name": "PM Kaushal Vikas Yojana — Skill India",
        "domain": "pmkvyofficial.org",
        "category": "EDUCATION",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the Ministry of Skill Development & Entrepreneurship's flagship training scheme.",
    },
    {
        "key": "swachhbharat",
        "name": "Swachh Bharat Mission",
        "domain": "swachhbharatmission.ddws.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for India's national sanitation and cleanliness mission.",
    },
    {
        "key": "pmuy",
        "name": "PM Ujjwala Yojana",
        "domain": "pmuy.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the scheme providing LPG connections to disadvantaged households.",
    },
    {
        "key": "pmfby",
        "name": "PM Fasal Bima Yojana (Crop Insurance)",
        "domain": "pmfby.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for the national crop insurance scheme for farmers.",
    },
    {
        "key": "jansuraksha",
        "name": "Jan Suraksha Schemes (PMJJBY / PMSBY / APY)",
        "domain": "jansuraksha.gov.in",
        "category": "BANKING",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for government-backed life, accident insurance, and pension schemes.",
    },
    {
        "key": "nsiindia",
        "name": "National Savings Institute (Sukanya Samriddhi Yojana)",
        "domain": "nsiindia.gov.in",
        "category": "FINANCE",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for government small-savings schemes including Sukanya Samriddhi Yojana.",
    },
    {
        "key": "wcd",
        "name": "Ministry of Women & Child Development",
        "domain": "wcd.nic.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Union ministry responsible for women and child welfare programmes including Beti Bachao Beti Padhao.",
    },
    {
        "key": "myscheme",
        "name": "MyScheme — National Government Services Portal",
        "domain": "myscheme.gov.in",
        "category": "OTHER_AUTHORITATIVE",
        "authority_level": "AUTHORITATIVE",
        "description": "Government of India's unified search platform for verifying genuine central and state schemes.",
    },
    {
        "key": "incometax",
        "name": "Income Tax Department — e-Filing Portal",
        "domain": "incometax.gov.in",
        "category": "FINANCE",
        "authority_level": "AUTHORITATIVE",
        "description": "Official e-filing and taxpayer services portal of the Income Tax Department, Government of India.",
    },
    {
        "key": "epfindia",
        "name": "EPFO — Employees' Provident Fund Organisation",
        "domain": "epfindia.gov.in",
        "category": "FINANCE",
        "authority_level": "AUTHORITATIVE",
        "description": "Statutory body under the Ministry of Labour and Employment administering employee provident fund accounts.",
    },
    {
        "key": "passportindia",
        "name": "Passport Seva — Ministry of External Affairs",
        "domain": "passportindia.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Official portal for passport applications, appointments, and status tracking.",
    },
    {
        "key": "sebi",
        "name": "SEBI — Securities and Exchange Board of India",
        "domain": "sebi.gov.in",
        "category": "FINANCE",
        "authority_level": "AUTHORITATIVE",
        "description": "India's securities market regulator, responsible for investor protection.",
    },
    {
        "key": "trai",
        "name": "TRAI — Telecom Regulatory Authority of India",
        "domain": "trai.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Statutory regulator for the telecommunications sector in India.",
    },
    {
        "key": "npci",
        "name": "NPCI — National Payments Corporation of India",
        "domain": "npci.org.in",
        "category": "BANKING",
        "authority_level": "AUTHORITATIVE",
        "description": "Umbrella organisation operating UPI and other retail digital payment systems in India.",
    },
    {
        "key": "indiapost",
        "name": "India Post — Department of Posts",
        "domain": "indiapost.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Government department operating India's postal network and parcel/customs delivery services.",
    },
    {
        "key": "eci",
        "name": "Election Commission of India",
        "domain": "eci.gov.in",
        "category": "GOVERNMENT",
        "authority_level": "AUTHORITATIVE",
        "description": "Constitutional body responsible for administering elections in India.",
    },
    {
        "key": "fssai",
        "name": "FSSAI — Food Safety and Standards Authority of India",
        "domain": "fssai.gov.in",
        "category": "HEALTHCARE",
        "authority_level": "AUTHORITATIVE",
        "description": "Statutory body regulating food safety standards and licensing under the Ministry of Health and Family Welfare.",
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
    {
        "source_key": "pmjay",
        "title": "Ayushman Bharat PM-JAY health cover amount and eligibility",
        "url": "https://pmjay.gov.in/",
        "language": "en-IN",
        "content": (
            "Ayushman Bharat PM-JAY provides eligible economically vulnerable families a health insurance "
            "cover of up to ₹5 lakh per family per year for secondary and tertiary hospitalization at "
            "empanelled public and private hospitals, at no cost to the beneficiary at the point of "
            "treatment. Eligibility is based on Socio-Economic Caste Census deprivation and occupational "
            "criteria — it is not a blanket entitlement automatically covering every citizen."
        ),
    },
    {
        "source_key": "pmaymis",
        "title": "PM Awas Yojana provides subsidy-linked housing assistance, not free houses",
        "url": "https://pmaymis.gov.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Awas Yojana provides interest subsidy on home loans and financial assistance to "
            "eligible economically weaker section, low-income, and middle-income households for "
            "constructing or purchasing a pucca house, under the PMAY-Urban and PMAY-Gramin verticals. "
            "Assistance is disbursed as a subsidy or installment-linked benefit subject to income-category "
            "eligibility, not as a free house handed out to every applicant."
        ),
    },
    {
        "source_key": "pmjdy",
        "title": "PM Jan-Dhan Yojana is a zero-balance bank account scheme, not a cash-gift scheme",
        "url": "https://www.pmjdy.gov.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Jan-Dhan Yojana allows any Indian citizen to open a zero-balance Basic Savings "
            "Bank Deposit account at any bank or business correspondent, with no minimum balance "
            "requirement, along with a RuPay debit card carrying accident insurance cover. It is a "
            "financial-inclusion scheme; opening an account does not itself trigger a direct government cash "
            "deposit, contrary to some viral claims."
        ),
    },
    {
        "source_key": "nrega",
        "title": "MGNREGA guarantees 100 days of wage employment through registered job cards",
        "url": "https://nrega.nic.in/",
        "language": "en-IN",
        "content": (
            "MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) legally guarantees at least "
            "100 days of paid unskilled manual work per financial year to every rural household whose adult "
            "members volunteer for it, at a wage rate notified by the state government. Work and wage "
            "payment are provided through the local Gram Panchayat and linked to a registered job card. It "
            "is not an unconditional cash payment handed out to anyone who simply asks for it."
        ),
    },
    {
        "source_key": "mudra",
        "title": "PM MUDRA Yojana provides repayable loans, not grants",
        "url": "https://www.mudra.org.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri MUDRA Yojana provides collateral-free loans of up to ₹10 lakh to non-corporate, "
            "non-farm small and micro enterprises through banks, NBFCs, and microfinance institutions, "
            "categorized as Shishu, Kishor, and Tarun based on loan size. It is a loan scheme requiring "
            "repayment with interest, not a grant or cash-transfer scheme."
        ),
    },
    {
        "source_key": "pmkvy",
        "title": "PMKVY provides free skill training and certification, not a direct job guarantee",
        "url": "https://www.pmkvyofficial.org/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Kaushal Vikas Yojana, the flagship scheme of the Ministry of Skill Development "
            "and Entrepreneurship, provides free short-duration skill training to Indian youth and a "
            "monetary reward on successful certification through recognized training centres. It certifies "
            "employable skills; it does not itself guarantee direct government employment to every trainee."
        ),
    },
    {
        "source_key": "swachhbharat",
        "title": "Swachh Bharat Mission funds toilet construction and sanitation, not general housing costs",
        "url": "https://swachhbharatmission.ddws.gov.in/",
        "language": "en-IN",
        "content": (
            "The Swachh Bharat Mission provides financial incentive support toward construction of "
            "individual household toilets for eligible rural and urban households, alongside solid waste "
            "management infrastructure, as part of its sanitation and cleanliness objectives. It does not "
            "fund general home construction or unrelated household expenses."
        ),
    },
    {
        "source_key": "pmuy",
        "title": "PM Ujjwala Yojana gives a free LPG connection; refills are paid at market price",
        "url": "https://www.pmuy.gov.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Ujjwala Yojana provides an LPG gas connection at no upfront deposit to adult "
            "women from economically disadvantaged households, replacing traditional cooking fuels with "
            "cleaner LPG. Beneficiaries are still required to pay for subsequent LPG refills at the "
            "applicable market price. Refills are not free under the base scheme, contrary to some viral "
            "claims."
        ),
    },
    {
        "source_key": "pmfby",
        "title": "PM Fasal Bima Yojana crop insurance is assessed via official crop-cutting experiments",
        "url": "https://pmfby.gov.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Fasal Bima Yojana provides crop insurance to farmers against yield losses from "
            "non-preventable natural risks such as drought, flood, and pest attack, from pre-sowing to "
            "post-harvest stages, on an area-approach basis, with the farmer paying only a nominal share of "
            "the premium while the government subsidizes the rest. Claims are assessed through official "
            "crop-cutting experiments and notified procedures, not on a self-declared basis."
        ),
    },
    {
        "source_key": "jansuraksha",
        "title": "PMJJBY, PMSBY and Atal Pension Yojana are opt-in schemes with defined eligibility",
        "url": "https://www.jansuraksha.gov.in/",
        "language": "en-IN",
        "content": (
            "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) and Pradhan Mantri Suraksha Bima Yojana "
            "(PMSBY) are government-backed life and accident insurance schemes offering affordable "
            "annual-renewal cover to bank account holders within a specified age range, with premiums "
            "auto-debited from the linked bank account only with the subscriber's consent. Atal Pension "
            "Yojana (APY) is a separate voluntary pension scheme for the unorganised sector guaranteeing a "
            "fixed monthly pension after age 60, based on the subscriber's own contribution amount and age "
            "of joining — none of these enroll a person automatically without consent."
        ),
    },
    {
        "source_key": "nsiindia",
        "title": "Sukanya Samriddhi Yojana is a parent-funded savings account, not a government cash gift",
        "url": "https://www.nsiindia.gov.in/",
        "language": "en-IN",
        "content": (
            "Sukanya Samriddhi Yojana is a small-savings scheme for a girl child, allowing a parent or "
            "guardian to open an account for a girl below 10 years of age at a post office or authorised "
            "bank, with deposits between a government-notified minimum and maximum annual limit, maturing "
            "to support her education or marriage expenses. It is a savings account funded by the "
            "depositor's own contributions, not a scheme where the government deposits money into the "
            "account on its own initiative."
        ),
    },
    {
        "source_key": "wcd",
        "title": "Beti Bachao Beti Padhao is an awareness and welfare campaign, not a direct cash scheme",
        "url": "https://wcd.nic.in/",
        "language": "en-IN",
        "content": (
            "Beti Bachao Beti Padhao is a Ministry of Women and Child Development campaign focused on "
            "addressing the declining child sex ratio and promoting the education, protection, and welfare "
            "of the girl child through awareness generation and multi-sectoral action, working alongside "
            "enabling schemes such as Sukanya Samriddhi Yojana — it is not itself a single direct "
            "cash-transfer programme paid to individual families."
        ),
    },
    {
        "source_key": "myscheme",
        "title": "Verify any scheme claim on the National Government Services Portal before believing it",
        "url": "https://www.myscheme.gov.in/",
        "language": "en-IN",
        "content": (
            "The National Government Services Portal, myscheme.gov.in, is the Government of India's unified "
            "search platform for checking the eligibility criteria, benefits, and application process of "
            "genuine central and state government schemes. Citizens are encouraged to look up a scheme's "
            "actual name on myscheme.gov.in or the concerned ministry's official website before believing or "
            "acting on a message claiming a new government scheme or benefit that is not listed there."
        ),
    },
    {
        "source_key": "cybercrime",
        "title": "'Digital arrest' video calls are not a real legal procedure",
        "url": "https://www.cybercrime.gov.in/",
        "language": "en-IN",
        "content": (
            "The Indian Cyber Crime Coordination Centre has warned that 'digital arrest' scams — where "
            "fraudsters posing as police, customs, or investigation agency officials make video calls "
            "threatening arrest unless money is paid immediately — are not a real legal procedure. No "
            "genuine law enforcement agency arrests or detains a person over a video call or demands money "
            "transfers to avoid arrest. Citizens should never make payments under such threats and should "
            "verify by contacting the police through official channels."
        ),
    },
    {
        "source_key": "rbi",
        "title": "Banks never ask customers to update KYC by clicking a link or sharing OTP",
        "url": "https://www.rbi.org.in/",
        "language": "en-IN",
        "content": (
            "RBI and banks have repeatedly clarified that they never ask customers to update KYC details, "
            "share OTPs, PINs, or passwords, or click links in SMS or WhatsApp messages to avoid account "
            "suspension. Messages threatening immediate account blocking unless a link is clicked are a "
            "common phishing pattern and should be reported through the bank's official channel, not acted "
            "upon."
        ),
    },
    {
        "source_key": "pib",
        "title": "Genuine government job recruitment never demands payment for guaranteed selection",
        "url": "https://pib.gov.in/",
        "language": "en-IN",
        "content": (
            "Genuine government job recruitment is conducted only through official notifications published "
            "on the concerned department's or recruitment board's own website — such as SSC, UPSC, IBPS, or "
            "a state public service commission — and never demands payment for guaranteed selection. "
            "Messages promising a confirmed government job in exchange for a fee are fraudulent and should "
            "be verified against the official recruiting body's notification before any payment is made."
        ),
    },
    {
        "source_key": "incometax",
        "title": "Income tax refunds are never released through a link in an SMS or email",
        "url": "https://www.incometax.gov.in/",
        "language": "en-IN",
        "content": (
            "The Income Tax Department has clarified that tax refunds are credited directly to a taxpayer's "
            "pre-validated bank account after processing on the official e-filing portal, and the department "
            "never asks taxpayers to click a link in an SMS or email and enter bank, card, or OTP details to "
            "'release' a refund. Any such message is a phishing attempt and should be reported, not acted on."
        ),
    },
    {
        "source_key": "epfindia",
        "title": "EPFO never asks members to share their UAN password or OTP by phone or SMS",
        "url": "https://www.epfindia.gov.in/",
        "language": "en-IN",
        "content": (
            "EPFO has clarified that it never contacts members by phone or SMS asking them to share their "
            "UAN password, OTP, or bank PIN to process a provident fund withdrawal or transfer. All EPF "
            "withdrawal and transfer requests must be submitted only through the official EPFO member portal "
            "or the UMANG app, and any caller asking for these details over the phone is attempting fraud."
        ),
    },
    {
        "source_key": "passportindia",
        "title": "Passport Seva does not offer paid shortcuts around police verification",
        "url": "https://www.passportindia.gov.in/",
        "language": "en-IN",
        "content": (
            "Passport Seva processes applications only through its official appointment and payment system "
            "on passportindia.gov.in, and passport issuance timelines and police verification requirements "
            "cannot be bypassed for an extra fee. Agents or messages offering a guaranteed 'instant passport' "
            "or 'skip verification' service in exchange for payment outside this official process are fraudulent."
        ),
    },
    {
        "source_key": "sebi",
        "title": "No registered advisor can guarantee fixed returns on stock market investments",
        "url": "https://www.sebi.gov.in/",
        "language": "en-IN",
        "content": (
            "SEBI has repeatedly warned that stock market investments carry risk and no SEBI-registered "
            "investment advisor, broker, or portfolio manager can lawfully guarantee fixed or assured returns. "
            "Messages, calls, or social media groups promising guaranteed high daily or monthly returns on "
            "stock or derivatives trading are a common investment fraud pattern and should be reported."
        ),
    },
    {
        "source_key": "trai",
        "title": "TRAI does not send SMS threatening mobile number disconnection over KYC",
        "url": "https://www.trai.gov.in/",
        "language": "en-IN",
        "content": (
            "TRAI has clarified that it does not send SMS or calls to individual mobile subscribers "
            "threatening disconnection of their number within a few hours due to pending KYC or Aadhaar "
            "verification. These messages, often asking the recipient to press a number or call back, are a "
            "phishing scam impersonating the telecom regulator and should not be acted upon."
        ),
    },
    {
        "source_key": "npci",
        "title": "Entering a UPI PIN is only required to send money, never to receive it",
        "url": "https://www.npci.org.in/",
        "language": "en-IN",
        "content": (
            "NPCI has clarified that UPI PIN entry is required only to authorize an outgoing payment; no "
            "genuine UPI transaction ever requires entering a PIN to receive money, accept a refund, or claim "
            "a cashback. Any request or QR code that asks for a PIN to 'collect' a payment is a scam designed "
            "to trick the victim into authorizing money out of their own account."
        ),
    },
    {
        "source_key": "indiapost",
        "title": "India Post does not collect customs or delivery fees through SMS links",
        "url": "https://www.indiapost.gov.in/",
        "language": "en-IN",
        "content": (
            "India Post has warned that it does not send SMS messages with external links asking recipients "
            "to pay a customs duty, delivery charge, or 'parcel release' fee to receive a held package. "
            "Genuine customs duties are payable only through official India Post or Customs department "
            "channels, and messages with unfamiliar payment links are a courier/parcel scam."
        ),
    },
    {
        "source_key": "eci",
        "title": "The Election Commission of India is the sole authority for official election results",
        "url": "https://www.eci.gov.in/",
        "language": "en-IN",
        "content": (
            "The Election Commission of India is the constitutional authority responsible for conducting "
            "elections and declaring official results in India. Unofficial vote counts, exit-poll numbers "
            "presented as final results, or claims of result manipulation circulated on social media before "
            "the ECI's own announcement should not be treated as confirmed until verified on the ECI's "
            "official channels."
        ),
    },
    {
        "source_key": "fssai",
        "title": "A genuine FSSAI license can be verified by its 14-digit number on the FSSAI portal",
        "url": "https://www.fssai.gov.in/",
        "language": "en-IN",
        "content": (
            "FSSAI requires every licensed food business to display a 14-digit license or registration number "
            "on its packaging or premises, and this number can be verified directly on the official FSSAI "
            "portal. A business or product claiming 'FSSAI approved' status without a verifiable 14-digit "
            "number should not be trusted as genuinely licensed."
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
    {
        "claim": "Ayushman Bharat PM-JAY provides free health insurance cover of up to ₹10 lakh per family per year.",
        "category": "Healthcare claim",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "PM Ujjwala Yojana gives women free LPG cylinder refills for life after the first connection.",
        "category": "Government scheme",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "MGNREGA guarantees at least 100 days of paid work per year to rural households who volunteer for it.",
        "category": "Government scheme",
        "expected_verdict": "VERIFIED",
    },
    {
        "claim": "A government official video-called me saying I am under digital arrest and must pay a fine immediately or be arrested.",
        "category": "Financial scam",
        "expected_verdict": "CONTRADICTED",
    },
    {
        "claim": "My bank sent an SMS asking me to click a link to update my KYC immediately or my account will be blocked.",
        "category": "Financial scam",
        "expected_verdict": "CONTRADICTED",
    },
]


def seed_if_empty(db: Session) -> None:
    """Seeds any SOURCES/DOCUMENTS not already present.

    Originally an all-or-nothing "only run against a completely empty
    database" gate. Changed to per-item idempotency (matched by domain for
    sources, by title for documents) so new entries added to SOURCES/
    DOCUMENTS later actually reach an already-seeded database on the next
    deploy, instead of silently never being applied."""
    embedder = LocalHashingEmbeddingProvider()
    now = datetime.now(timezone.utc)

    existing_sources_by_domain = {source.domain: source for source in db.query(Source).all()}
    sources_by_key: dict[str, Source] = {}

    for spec in SOURCES:
        existing = existing_sources_by_domain.get(spec["domain"])
        if existing is not None:
            sources_by_key[spec["key"]] = existing
            continue
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

    existing_doc_titles = {title for (title,) in db.query(Document.title).all()}

    for doc_spec in DOCUMENTS:
        if doc_spec["title"] in existing_doc_titles:
            continue
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
