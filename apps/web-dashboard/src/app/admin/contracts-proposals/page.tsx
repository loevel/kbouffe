"use client";

import { useState } from "react";
import {
    FileText,
    Download,
    Copy,
    Check,
    AlertCircle,
} from "lucide-react";
import { Badge, Button, useLocale, toast } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";

interface ContractTemplate {
    id: string;
    name: string;
    segment: string;
    keyTerms: string[];
    highlights: string[];
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function ContractsProposalsPage() {
    const { t } = useLocale();
    const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

    const templates: ContractTemplate[] = [
        {
            id: "standard",
            name: "Standard Restaurant Agreement",
            segment: "Segment A & B (Casual & Growth)",
            keyTerms: [
                "5% transaction commission (base tier)",
                "30-day termination notice",
                "Monthly settlement via MTN MoMo",
                "Standard support: 24-hour response",
            ],
            highlights: [
                "Simple one-page agreement",
                "Flexible: Monthly renewal option",
                "Covers: Orders, Boost Packs, payment terms",
                "30-day trial period (risk-free)",
            ],
        },
        {
            id: "growth_tier",
            name: "Growth Tier Agreement",
            segment: "Segment B & C (Growth & Established)",
            keyTerms: [
                "3.5% commission at 200K+ GMV/month",
                "Tiered pricing structure",
                "60-day termination notice",
                "Priority support: 4-hour response",
                "Quarterly business reviews",
            ],
            highlights: [
                "Rewards growth with lower commission",
                "Automatic tier promotion/demotion monthly",
                "Includes health scoring monitoring",
                "Monthly performance dashboard access",
                "Dedicated CSM assignment",
            ],
        },
        {
            id: "enterprise",
            name: "Enterprise Partnership Agreement",
            segment: "Segment C (Established 30M+ GMV/month)",
            keyTerms: [
                "2.5% commission at 500K+ GMV/month",
                "Custom SLA: 99.9% uptime, <1hr response",
                "Quarterly executive reviews",
                "Revenue sharing discussions (up to 2% discount for 1M+ GMV)",
                "API access + white-label options",
                "Annual renewal or per-quarter",
            ],
            highlights: [
                "Strategic partnership model",
                "Custom feature development",
                "Integration capabilities",
                "Co-marketing opportunities",
                "Preferential treatment on marketing",
                "Priority bug fixes",
            ],
        },
        {
            id: "b2b_supplier",
            name: "B2B Supplier Agreement",
            segment: "Segment D (Suppliers & Aggregators)",
            keyTerms: [
                "2.5% commission on marketplace sales",
                "Seasonal support clause (harvest cycles)",
                "Monthly settlement",
                "Preferential placement options",
                "Restaurant matchmaking support",
            ],
            highlights: [
                "Designed for agricultural suppliers",
                "Flexible seasonal scaling",
                "Logistics partnership provisions",
                "Multi-restaurant relationships enabled",
                "Cooperative support framework",
            ],
        },
        {
            id: "white_label",
            name: "White-Label Integration Agreement",
            segment: "Enterprise Partners (Premium)",
            keyTerms: [
                "Revenue share model: 70/30 split",
                "Dedicated infrastructure",
                "Branded platform with partner logo",
                "Annual commitment minimum",
                "Full API access + webhooks",
                "12-month notice for termination",
            ],
            highlights: [
                "For high-volume partner aggregation",
                "Custom branding and domain",
                "Full restaurant onboarding",
                "Performance monitoring dashboard",
                "Quarterly business reviews",
                "Strategic partnership roadmap",
            ],
        },
    ];

    const proposalSections = [
        {
            title: "Executive Summary",
            content: "• Kbouffe value proposition: 5% vs 15-30% commission\n• Cost savings projection for this restaurant\n• Growth levers: Boost Packs, CSM support, health scoring\n• 90-day pilot structure and success metrics",
        },
        {
            title: "Current State Assessment",
            content: "• Current platforms and commission rates\n• Monthly GMV and order volume\n• Pain points identified (support, features, cost)\n• Growth opportunities identified\n• Competitive analysis vs alternatives",
        },
        {
            title: "Kbouffe Solution",
            content: "• Platform overview and capabilities\n• Dedicated CSM assignment\n• Health scoring and analytics dashboard\n• Boost Pack options and ROI calculator\n• Integration and technical requirements\n• Timeline and onboarding process",
        },
        {
            title: "Financial Impact",
            content: "• Cost comparison table (5% vs current rate)\n• Monthly savings projection (minimum order scenario)\n• Boost Pack revenue opportunity\n• Break-even analysis (when profit > cost savings)\n• 12-month growth projection",
        },
        {
            title: "Risk Mitigation",
            content: "• 30-day trial (no commitment)\n• Performance guarantees (uptime, response time)\n• Data security and privacy compliance\n• Payment processing reliability\n• Dispute resolution process\n• Exit strategy (if unsatisfied)",
        },
        {
            title: "Success Criteria & KPIs",
            content: "• Week 1-2: Menu live, first orders processed\n• Month 1: 10+ orders per day (baseline)\n• Month 3: +20% orders vs current platform (success metric)\n• Month 6: Upgrade to Boost Pack (if healthy)\n• Year 1: +40% revenue growth (aspirational)",
        },
    ];

    const rfpTemplate = `# RFP Response: Enterprise Food Delivery Platform

## Company: Kbouffe
## Prepared for: [Restaurant Name]
## Date: [Current Date]
## Valid Until: [60 days from now]

---

## 1. EXECUTIVE SUMMARY

Kbouffe is a local-first food delivery platform designed to maximize restaurant profitability through:
- **Lowest commission rate**: 5% vs competitors' 15-30%
- **Dedicated support**: Assigned CSM, health scoring, churn prediction
- **Proven growth**: Average +40% orders for participating restaurants
- **Flexible tiers**: 3.5% at 200K GMV, 2.5% at 500K GMV

---

## 2. FINANCIAL TERMS

### Commission Structure
- **Base**: 5% per transaction
- **Growth tier**: 3.5% if GMV ≥ 200K FCFA/month (automatic)
- **Enterprise**: 2.5% if GMV ≥ 500K FCFA/month (automatic)
- **No setup fees, no monthly minimums, no hidden charges**

### Boost Packs (Optional)
- Visibility Pack: 5,000 FCFA/week
- Premium Pack: 10,000 FCFA/week
- Bundle discount: 3 weeks at 12,000 FCFA
- **Free 1-week trial available**

### Settlement
- Monthly via MTN MoMo (preferred)
- Payment within 5 business days of month-end
- Transparent reporting dashboard

---

## 3. SERVICE LEVEL AGREEMENT (SLA)

### Uptime Guarantee
- 99.5% platform availability (monitored 24/7)
- Failover systems in place
- Redundant payment processing

### Support Response Times
- Base tier: 24-hour response (email/WhatsApp)
- Growth tier: 4-hour response (dedicated CSM)
- Enterprise tier: 1-hour response (executive escalation)
- **Critical incidents**: 30-minute escalation path

### Performance Metrics
- Order processing: <100ms
- Menu updates: Live within 5 minutes
- Payment confirmation: <30 seconds
- Customer support: No more than 2 business days without acknowledgment

---

## 4. TECHNICAL INTEGRATION

### Integration Options
1. **Standard**: Dashboard-based menu & order management
2. **API**: REST API for POS system integration
3. **White-label**: Custom branded platform

### Data & Security
- SSL 2FA authentication
- PCI DSS compliance for payments
- GDPR/CCPA data privacy
- Encrypted data transmission
- Monthly security audits

### Onboarding Timeline
- Day 1: Account creation, CSM assignment
- Day 2-3: Menu upload & photography
- Day 4-5: Payment setup & testing
- Day 5: Live on platform

---

## 5. SUCCESS METRICS (90-Day Pilot)

| Metric | Week 1-2 | Month 1 | Month 3 | Outcome |
|--------|----------|---------|---------|---------|
| Orders/day | 5+ | 10+ | 12+ | Move to paid tier |
| Menu quality | Complete | 80%+ items | 95%+ items | Retention |
| Response time | <24hrs | <24hrs | <24hrs | SLA met |
| Customer rating | 4.0+ | 4.2+ | 4.4+ | Growth |

### Success = Month 3 orders > Month 1 baseline + 20%

---

## 6. TERMS & CONDITIONS

### Commitment
- **Trial period**: 30 days (zero commitment, cancel anytime)
- **Standard agreement**: Monthly renewal (flexible exit)
- **Growth/Enterprise**: 6-month commitment (60-day notice for termination)

### Termination Clause
- Either party may terminate with written notice
- Outstanding commissions settled within 30 days
- Data export available for 90 days post-termination
- No penalties or early exit fees

### Dispute Resolution
1. First: Direct communication (CSM mediation)
2. Second: Management escalation (30-day period)
3. Final: Binding arbitration (mutually agreed location)

---

## 7. WHY KBOUFFE

✓ **75% cheaper** than Jumia (20%) or Uber Eats (30%)
✓ **Dedicated CSM** (not shared bot support)
✓ **Proven growth** (+40% orders average)
✓ **Local-first** (we understand your market)
✓ **Fair partnership** (no surprise fees, transparent pricing)
✓ **Risk-free trial** (30 days, cancel anytime)

---

## 8. NEXT STEPS

1. **Review & Questions** (24 hours): Ask anything, no obligation
2. **Trial Agreement** (Day 1): Sign simple 1-page agreement
3. **Onboarding** (Day 2-5): Setup with dedicated CSM
4. **Go Live** (Day 5): Accept orders on Kbouffe
5. **Monitor & Optimize** (Days 6-90): Weekly check-ins, growth planning

---

## 9. CONTACT & COMMITMENT

- **CSM**: [Your Name] - [Phone] - [Email]
- **Escalation**: [Manager Name] - [Manager Phone]
- **24/7 Support**: support@kbouffe.com

**This proposal is valid for 60 days. Contact us to move forward.**
`;

    const handleCopyTemplate = (templateId: string) => {
        setCopiedTemplate(templateId);
        setTimeout(() => setCopiedTemplate(null), 2000);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t.adminPages?.contractsProposals?.title ?? "Contracts & Proposals"}</h1>
                    <p className="text-gray-600 mt-1">{t.adminPages?.contractsProposals?.subtitle ?? "Agreement templates and sales proposals"}</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    {t.adminPages?.contractsProposals?.downloadAllTemplates ?? "Download All Templates"}
                </Button>
            </div>

            {/* Proposal Structure */}
            <motion.div
                className="bg-white rounded-lg border border-gray-200 p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.contractsProposals?.rfpProposalStructure ?? "RFP/Proposal Structure"}</h2>
                <div className="space-y-3">
                    {proposalSections.map((section, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <h3 className="font-semibold text-gray-900 text-sm mb-2">{idx + 1}. {section.title}</h3>
                            <p className="text-xs text-gray-600 whitespace-pre-line">{section.content}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* RFP Template */}
            <motion.div
                className="bg-blue-50 border border-blue-200 rounded-lg p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-blue-900">{t.adminPages?.contractsProposals?.enterpriseRfpTemplate ?? "Enterprise RFP Template"}</h2>
                        <p className="text-sm text-blue-700 mt-1">{t.adminPages?.contractsProposals?.readyToCustomize ?? "Ready-to-customize proposal document"}</p>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(rfpTemplate);
                            handleCopyTemplate("rfp");
                            toast({ title: "Copied to clipboard" });
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm font-medium"
                    >
                        {copiedTemplate === "rfp" ? (
                            <>
                                <Check className="w-4 h-4" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <pre className="bg-white rounded border border-blue-200 p-4 text-xs overflow-auto max-h-96 text-gray-900">
                    {rfpTemplate}
                </pre>
            </motion.div>

            {/* Agreement Templates */}
            <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-lg font-bold text-gray-900">{t.adminPages?.contractsProposals?.agreementTemplates ?? "Agreement Templates by Segment"}</h2>
                <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => (
                        <motion.div
                            key={template.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            variants={itemVariants}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{template.segment}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        handleCopyTemplate(template.id);
                                        toast({ title: "Template copied to clipboard" });
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm"
                                >
                                    {copiedTemplate === template.id ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2">Key Terms</h4>
                                    <ul className="space-y-1">
                                        {template.keyTerms.map((term, idx) => (
                                            <li key={idx} className="text-sm text-gray-600">
                                                • {term}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2">Highlights</h4>
                                    <ul className="space-y-1">
                                        {template.highlights.map((highlight, idx) => (
                                            <li key={idx} className="text-sm text-gray-600">
                                                ✓ {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Key Legal Considerations */}
            <motion.div
                className="bg-amber-50 border border-amber-200 rounded-lg p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-amber-900">{t.adminPages?.contractsProposals?.legalReview ?? "Legal Review Required"}</h3>
                        <ul className="space-y-2 mt-2 text-sm text-amber-900">
                            <li>• Have local legal counsel review all agreements before signing</li>
                            <li>• Ensure compliance with local food delivery regulations</li>
                            <li>• Verify payment processing compliance (MTN MoMo terms)</li>
                            <li>• Confirm data privacy and consumer protection requirements</li>
                            <li>• Include proper tax and VAT handling in invoices</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
