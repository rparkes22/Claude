// Job 2417 — Arroyos Desert Princess — Utility Coordination data.
// Transcribed 1:1 from "2417 Utility Coordination Tracking Form.xlsx".
// Dates are raw Excel serials (days since 1899-12-30), converted at render time.
// Chain columns: r = received from utility, s = sent to client,
//                b = received back from client, f = forwarded to utility.

const XL_EPOCH = Date.UTC(1899, 11, 30);
const xlDate = (serial) => new Date(XL_EPOCH + serial * 86400000);
const xd = (serial, opts) => serial == null ? null :
  xlDate(serial).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const xdShort = (serial) => serial == null ? null :
  xlDate(serial).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', timeZone: 'UTC' });

// Workbook's last recorded activity (Lot 61, 6/20/19) — the "as of" moment.
const ASOF = 43636;
const ASOF_LABEL = xd(ASOF);
const waitDays = (since) => since == null ? null : ASOF - since;

// ---- ball-in-court derivation -------------------------------------------
// Walk every dated cell in a group's steps; the latest one tells us who is
// holding the document. Column precedence inside a step follows the chain.
const COL_ORDER = ['r', 's', 'b', 'f'];
const COL_HOLDER = { r: 'msa', s: 'client', b: 'msa', f: 'utility' };

function deriveBall(group) {
  if (group.state === 'na') return { holder: 'na', since: null };
  let last = null;
  (group.steps || []).forEach((st) => {
    COL_ORDER.forEach((c, ci) => {
      const v = st[c];
      if (v == null) return;
      if (!last || v > last.serial || (v === last.serial && ci >= last.ci)) {
        last = { serial: v, ci, col: c, step: st.label };
      }
    });
  });
  if (!last) return { holder: 'pending', since: null };
  if (group.state === 'done') return { holder: 'done', since: last.serial };
  return { holder: COL_HOLDER[last.col], since: last.serial, step: last.step };
}

const BALL_META = {
  utility: { label: 'With utility', cls: 'bc-utility' },
  client:  { label: 'With client',  cls: 'bc-client' },
  msa:     { label: 'In MSA court', cls: 'bc-msa' },
  done:    { label: 'Complete',     cls: 'bc-done' },
  pending: { label: 'Not started',  cls: 'bc-pending' },
  na:      { label: 'N/A',          cls: 'bc-pending' },
};

const st = (label, d = {}) => ({ label, ...d });

// ==========================================================================
// SCE — RULE 15 (two work orders)
// ==========================================================================
const SCE_R15 = {
  id: 'sce-r15', utility: 'SCE', utilityFull: 'Southern California Edison',
  track: 'Rule 15', tag: 'R15',
  contact: 'SCE Planner: Tim Deckard',
  workOrders: [
    {
      id: 'r15-wo1', name: 'WO #1 — Lots 82-124', desc: 'Rule 15 Lots 82-124 · S&M to Lots 117-124',
      groups: [
        { name: 'Rule 15/20 Conduit Design Submittal', state: 'done',
          comment: 'Expect SCE Preliminary Design week of 12/20/17. Tim Deckard is the SCE Planner.',
          steps: [
            st('Submittal made to SCE'), st('Preliminary design received from SCE for comments'),
            st('Forwarded to client for comments'), st('Reviewed and approved by client'),
            st('Send approval/revisions to SCE for final'), st('Received final design from SCE'),
            st('Send final design to client'),
          ],
          reconcile: 'Dates were never logged — status notes carry the history (submitted 10/16/17, final design 12/8/17, paid & returned 1/8/18).' },
        { name: 'SCE Fee Letter — WO #1', state: 'pending', steps: [
            st('Fee letter received from SCE'), st('Fee letter sent to client'),
            st('Discount/refundable options sent for signatures'), st('Received signed options form back'),
            st('Sent signed form to SCE'),
          ] },
        { name: 'SCE/Spectrum Grant of Easement Docs', state: 'pending', steps: [
            st('Received from SCE'), st('Sent to client for signatures/notary'),
            st('Received back from client'), st('Sent signed easement docs to SCE'),
          ] },
      ],
      contracts: [
        { invoice: '302205', invDate: 43096, td: 'TD1328099', design: '975984',
          amount: 22313.30, amountLabel: '$22,313.30 (discount)', paid: 43108,
          desc: 'Rule 15 Lots 82-124. S&M to Lots 117-124.',
          status: '10/16/17 Full submittal for R15 Lots 82-124 with Service and Meters to Lots 117-120. On 10-18-17 added Service and Meters to Lots 121-124. Expect Preliminary Design week of 12/20/17. Received New Final Design on 12/8/17. Waiting on billing contracts. 1/3/18 Received contracts and forwarded to client. 1/8/18 Received payment and signed contracts, forwarded to SCE.' },
      ],
    },
    {
      id: 'r15-wo2', name: 'WO #2 — Chimayo Drive, Lots 1-22', desc: 'Rule 15 to Lots 1-22 with S&M to 20-22 · S. Chimayo Dr.',
      groups: [
        { name: 'Rule 15/20 Conduit Design Submittal', state: 'done',
          comment: 'Chimayo Rule 15 to Lots 1-22 with S&M to 20-22',
          steps: [
            st('Submittal made to SCE', { f: 43180 }),
            st('Preliminary design received from SCE for comments', { r: 43235 }),
            st('Forwarded to client for comments', { s: 43237 }),
            st('Reviewed and approved by client'),
            st('Send approval/revisions to SCE for final', { f: 43237 }),
            st('Received final design from SCE', { r: 43265 }),
            st('Send final design to client', { s: 43265, b: 43266, f: 43271 }),
          ] },
        { name: 'SCE Fee Letter — WO #2', state: 'pending', steps: [
            st('Fee letter received from SCE'), st('Fee letter sent to client'),
            st('Discount/refundable options sent for signatures'), st('Received signed options form back'),
            st('Sent signed form to SCE'),
          ] },
        { name: 'SCE/Spectrum Grant of Easement Docs', steps: [
            st('Received from SCE', { r: 43304 }),
            st('Sent to client for signatures/notary', { s: 43305 }),
            st('Received back from client'),
            st('Sent signed easement docs to SCE'),
          ] },
      ],
      contracts: [
        { invoice: '7590161312', invDate: 43291, td: 'TD 1383593', design: '1021626',
          amount: 18111.92, amountLabel: '$18,111.92', paid: null, desc: '',
          status: 'Chimayo 3-6-18 Building permits to be pulled in 6 months time (approx 9-6-18). Client to provide phasing sheet and updated forms. 5/15/18 Received SCE Preliminary Design. Sent signed Preliminary to SCE asking for clarification of M&S to Lots 20-22. Emailed Tim Deckard on 6/13 to clarify job is moving to final design. Received Final Design on 6/14/18. Received revised Final Design on 6/25 and sent to client on 6/26.' },
        { invoice: '7590178282', invDate: 43384, td: '—', design: '1021626',
          amount: 19460.99, amountLabel: '$19,460.99', paid: 43404, desc: 'Invoice 22473',
          status: 'Difference of $1,349.07 is due.' },
      ],
    },
  ],
};

// ==========================================================================
// SCE — RULE 16 (20 work orders, one per lot group)
// ==========================================================================
// Compact builder: chain rows shared by most R16 blocks.
function r16(lots, tm, o) {
  const steps = [];
  steps.push(st('Submittal made to SCE', o.sub != null ? { f: o.sub } : {}));
  if (o.ack != null) steps.push(st('SCE acknowledged receipt of submittal', { r: o.ack }));
  if (o.rev != null) steps.push(st('SCE completed review, submitted for design', o.revCol === 's' ? { s: o.rev } : { r: o.rev }));
  if (o.req != null) steps.push(st('Request for contract, construction & permit sent', { r: o.req }));
  (o.extra || []).forEach((e) => steps.push(e));
  return {
    id: 'r16-' + lots.replace(/[^0-9a-z]/gi, ''), lots: 'Lots ' + lots, tm,
    state: o.state || 'done', steps, status: o.status || '',
    contract: o.contract,
  };
}
const c$ = (invoice, invDate, td, design, paid) => ({ invoice, invDate, td, design, amount: 0, amountLabel: '$0 (no fee)', paid: paid || null });

const SCE_R16_WOS = [
  r16('72-76', 'TM 34322-2', { sub: 43011, state: 'open',
    extra: [
      st('Design, options and invoice received from SCE', { r: 43039 }),
      st('Sent to client for signatures and payment', { s: 43039 }),
      st('Signed docs received from client'), st('Payment received from client'),
      st('Signed docs and payment sent to SCE'),
    ],
    status: '10/3/17 Submitted Rule 16 Lots 72-76. 10/10/17 Received notification that submittal has been accepted and sent to planning. Expect contract about 1st week of November. 10/31/17 Received R16 Contract and Meter Application and forwarded to client for signatures. 11/7/17 Client signed. Sent forms to SCE. 11/14/17 Attachment was missing. Resend signed R16 contract.',
    reconcile: 'Grid says the ball is still with the client — but the notes say they signed 11/7/17 and the form was re-sent. Return dates were never logged.',
    contract: c$('296151', 43028, 'TD 1322898', '971554') }),
  r16('77-80', 'TM 34322-2', { sub: 43117, ack: 43117, rev: 43133,
    extra: [
      st('Received Rule 16 contract', { r: 43165, s: 43165, b: 43166, f: 43166 }),
      st('Received Rule 16 contract (new billing package)', { r: 43195, s: 43196, b: 43199, f: 43199 }),
    ],
    status: 'Expecting Final Work Order and Billing on 3/5/18. 3/6/18 sent SCE request for status update. 3/7/18 Sent signed R16 contract to SCE. Billing package re-sent to client for signatures, received from client on 4/9.',
    contract: c$('307599', 43148, 'TD1362691', '1004509') }),
  r16('82-84', 'TM 34322-2', { sub: 43146, ack: 43146, rev: 43164,
    extra: [st('Received Rule 16 contract', { r: 43209, s: 43213, b: 43213, f: 43213 })],
    status: "2/15/18 Submitted Rule 16 for Lots 82-84. 3/6/18 Sent to planning for design. 4/9/18 Requested status update and CC'D form from SCE. Received contract on 4/19/2018. Sent to client on 4/23/2018.",
    contract: c$('313162', 43201, 'TD1374294', '1014268') }),
  r16('85-87', 'TM 34322-2', { sub: 43146, ack: 43146, rev: 43165, req: 43201,
    extra: [st('Received Rule 16 contract', { r: 43223, s: 43224, b: 43224, f: 43224 })],
    status: "2/15/18 Submitted Rule 16 for Lots 85-87. 3/6/18 R'cvd confirmation sent to planning for design. Received contract 5/3/18. Signed by client and returned to SCE on 5/4/2018.",
    contract: c$('311605', 43186, 'TD1374506', '1014448') }),
  r16('88-90', 'TM 34322-2', { sub: 43146, ack: 43146, rev: 43164, req: 43201,
    extra: [st('Received Rule 16 contract', { r: 43227, s: 43227, b: 43228, f: 43228 })],
    status: "2/15/18 Submitted Rule 16 for Lots 88-90. Received contract from SCE on 5/7/18. Received back from client and forwarded to SCE on 5/8.",
    contract: c$('311444', 43185, 'TD1374285', '1014259') }),
  r16('113-116', 'TM 34322-2', { sub: 43390, ack: 43390, rev: 43390, revCol: 's',
    extra: [st('Received Rule 16 contract', { r: 43424, s: 43424, b: 43424, f: 43424 })],
    contract: c$('335276', 43408, 'TD 1459239', '1081439') }),
  r16('110-112', 'TM 34322-2', { sub: 43390, ack: 43391, rev: 43391, revCol: 's',
    extra: [st('Received Rule 16 contract', { r: 43424, s: 43424, b: 43424, f: 43424 })],
    contract: c$('334710', 43403, 'TD 1459486', '1081630') }),
  r16('107-109', 'TM 34322-2', { sub: 43390, ack: 43391, rev: 43391, revCol: 's',
    extra: [st('Received Rule 16 contract', { r: 43424, s: 43424, b: 43424, f: 43424 })],
    contract: c$('334765', 43403, 'TD 1459509', '1081645') }),
  r16('104-106', 'TM 34322-2', { sub: 43390, ack: 43390, rev: 43391, revCol: 's',
    extra: [st('Received Rule 16 contract', { r: 43066, s: 43066, b: 43432, f: 43432 })],
    status: 'Email to SCE on 11/27 regarding expediting. Received billing package 11/27/2018. Sent contract back to SCE 11/28/2018. 12/5 Inspection package released. 12/27 Hot mandrel scheduled.',
    contract: { invoice: '—', invDate: null, td: 'TD 1459538', design: '—', amount: 0, amountLabel: '$0 (no fee)', paid: null } }),
  r16('91-94', 'TM 34322-2', { sub: 43411, rev: 43412,
    extra: [st('Received Rule 16 contract', { r: 43451, s: 43451, b: 43452, f: 43452 })],
    status: 'R16 submitted to SCE on 11/7/2018. Forwarded to planning on 11/8. Contract due 12/12 per MR.',
    contract: c$('337480', 43433, '1467174', '1087686') }),
  r16('16-19', 'TM 34322-1', { sub: 43423, ack: 43423,
    extra: [st('Received Rule 16 contract', { r: 43460, s: 43460, b: 43461, f: 43461 })],
    status: 'R16 submitted to SCE on 11/19/2018. Forwarded to planning on 12/8.',
    contract: c$('339386', 43452, '1470303', '1090096') }),
  r16('101-103', 'TM 34322-2', { sub: 43454, ack: 43454, rev: 43455,
    extra: [st('Received Rule 16 contract', { r: 43495, s: 43495, b: 43496, f: 43497 })],
    contract: c$('341806', 43481, '1481349', '1098861') }),
  r16('98-100', 'TM 34322-2', { sub: 43461, ack: 43461, rev: 43465,
    extra: [st('Received Rule 16 contract', { r: 43495, s: 43495, b: 43496, f: 43497 })],
    contract: c$('342480', 43488, '1483192', '1100261') }),
  r16('95-97', 'TM 34322-2', { sub: 43461, ack: 43461, rev: 43465,
    extra: [
      st('Received Rule 16 contract', { r: 43508, s: 43508 }),
      st('Received Rule 16 contract (new billing package)', { b: 43509, f: 43510 }),
    ],
    contract: c$('343185', 43494, '1483210', '1100274') }),
  r16('13-15', 'TM 34322-1', { sub: 43461, ack: 43461, rev: 43461,
    extra: [st('Received Rule 16 contract', { r: 43508, s: 43508, b: 43509, f: 43510 })],
    contract: c$('342705', 43490, '1482323', '1099599') }),
  r16('10-12', 'TM 34322-1', { sub: 43461, ack: 43461, rev: 43461,
    extra: [
      st('Sent to client for signatures and payment', { s: 43508 }),
      st('Signed docs received from client', { b: 43508 }),
      st('Payment received from client', { b: 43509 }),
      st('Signed docs and payment sent to SCE', { f: 43510 }),
    ],
    contract: c$('342772', 43490, '1482444', '1099703') }),
  r16('7-9', 'TM 34322-1', { sub: 43461, ack: 43462, rev: 43462,
    extra: [
      st('Sent to client for signatures and payment', { r: 43498, s: 43500 }),
      st('Signed docs received from client', { b: 43500 }),
      st('Signed docs and payment sent to SCE', { f: 43501 }),
    ],
    contract: c$('343009', 43493, '1482787', '1099975') }),
  r16('4-6', 'TM 34322-1', { sub: 43461, ack: 43465, rev: 43465,
    extra: [
      st('Sent to client for signatures and payment', { r: 43498, s: 43500 }),
      st('Signed docs received from client', { b: 43500 }),
      st('Signed docs and payment sent to SCE', { f: 43501 }),
    ],
    contract: c$('342763', 43490, '1483159', '1100236') }),
  r16('1-3', 'TM 34322-1', { sub: 43461, ack: 43465, rev: 43465,
    extra: [
      st('SCE sent billing contract', { r: 43508 }),
      st('Forwarded to client for signature', { s: 43508 }),
      st('Signed docs received from client', { b: 43509 }),
      st('Signed docs and payment sent to SCE', { f: 43510 }),
    ],
    contract: c$('343152', 43494, '1483170', '1100246') }),
  r16('61', 'TM 34322-1', {
    extra: [
      st('SCE sent billing contract', { r: 43635 }),
      st('Forwarded to client for signature', { s: 43636 }),
      st('Signed docs received from client', { b: 43636 }),
      st('Signed docs and payment sent to SCE', { f: 43636 }),
    ],
    contract: c$('357984', 43634, '1548158', '1151773') }),
];

const SCE_R16 = {
  id: 'sce-r16', utility: 'SCE', utilityFull: 'Southern California Edison',
  track: 'Rule 16', tag: 'R16', workOrders: SCE_R16_WOS,
};

// ==========================================================================
// GAS COMPANY — Backbone + Service & Meters
// ==========================================================================
const GAS_BACKBONE = {
  id: 'gas-bb', utility: 'Gas Co.', utilityFull: 'Southern California Gas Company',
  track: 'Backbone', tag: 'GAS',
  meta: 'Gas Co. Project No. 215931 · Access Code 19257',
  groups: [
    { name: 'Gas Co. Backbone Submittal', steps: [
        st('Submittal made to Gas Co.', { f: 43236 }),
        st('Preliminary design received from Gas Co. (permit use only)'),
        st('Reviewed and approved by client'),
        st('Send approval/revisions to Gas Co. for final'),
        st('Received final design from Gas Co.'),
        st('Send final design to client'),
      ],
      comment: 'Residential application sent to Gas Co. 5/16/18. Request from Jorge Cazares for additional information on 5/16/18.' },
    { name: 'Gas Company Fee Letter and Contract', state: 'done', steps: [
        st('Fee letter / contract received from Gas Co.', { r: 43243 }),
        st('Fee letter sent to client for payment'),
        st('Payment received from client'),
        st('Signed contracts received from client', { b: 43325 }),
        st('Signed contracts sent to Gas Company', { f: 43325 }),
      ],
      comment: 'Contract received on 5/23/18. Jorge Cazares has advised Mike Pike not to sign until closer to construction date. Client signed and returned 8/13 — forwarded to Gas Co. Gas Company has acknowledged processing of contract 215931 on 8/30/18.' },
    { name: 'Gas Co. Grant of Easement Docs', state: 'na', steps: [
        st('Received from Gas Co.'), st('Sent to client for signatures/notary'),
        st('Received back from client'), st('Sent signed easement docs to Gas Co.'),
      ],
      comment: 'No easement required — PUE R/W No. 255765 per conversation with J. Cazares on 10/01/2018.' },
  ],
  contracts: [
    { invoice: 'Proj. 215931', invDate: 43243, td: '—', design: '215931',
      amount: 0, amountLabel: '$0 — no money due', paid: null,
      status: '8/27 — wrong contract was sent and confirmed as received by J. Cazares but not by NB-Process. Explanation and correct contract sent to Gas Company on 8/27. Gas company to honor May 23rd contract.' },
  ],
};

const GAS_METERS = {
  id: 'gas-sm', utility: 'Gas Co.', utilityFull: 'Southern California Gas Company',
  track: 'Service & Meters', tag: 'GAS',
  phases: [
    { id: 'gsm-p1', name: 'Phase 1 — Lots 117-124', state: 'done', steps: [
        st('Submittal made to Gas Co.'),
        st('Signed docs received from client', { b: 43066 }),
        st('Signed docs and payment sent to Gas Co.', { f: 43070 }),
      ],
      contract: { invoice: '208916', invDate: 43012, td: '—', design: '—', amount: 0, amountLabel: '$0 due', paid: 43070 },
      status: 'Service and Meters to Lots 117-124 on Zuni Court. Signed contract sent to Gas Company on 12/1/17.' },
    { id: 'gsm-p2a', name: 'Phase 2 — Lots 104-116', state: 'done', steps: [
        st('Submittal made to Gas Co.', { f: 43432 }),
        st('Contract and invoice received from Gas Co.', { r: 43446 }),
        st('Sent to client for signatures and payment', { s: 43446 }),
        st('Signed docs received from client', { b: 43447 }),
        st('Signed docs and payment sent to Gas Co.', { f: 43447 }),
      ],
      contract: { invoice: '221804', invDate: 43444, td: '221804', design: '—', amount: 0, amountLabel: '$0', paid: null },
      status: 'Executed contract for Lots 104-116.' },
    { id: 'gsm-p2b', name: 'Phase 2 — Lots 91-94', state: 'done', steps: [
        st('Submittal made to Gas Co.', { f: 43444 }),
        st('Contract and invoice received from Gas Co.', { r: 43455 }),
        st('Sent to client for signatures and payment', { s: 43458 }),
        st('Signed docs received from client', { b: 43461 }),
        st('Signed docs and payment sent to Gas Co.', { f: 43461 }),
      ],
      contract: { invoice: '222215', invDate: 43453, td: '222215', design: '—', amount: 0, amountLabel: '$0', paid: null },
      status: '' },
  ],
};

// ==========================================================================
// FRONTIER (VERIZON) + TIME WARNER CABLE
// ==========================================================================
const FRONTIER = {
  id: 'frontier', utility: 'Frontier', utilityFull: 'Frontier (Verizon)',
  track: 'Backbone', tag: 'FTR',
  groups: [
    { name: 'Verizon Backbone Submittal — Lots 1-22 S. Chimayo', state: 'done', steps: [
        st('Submittal made to Verizon', { f: 43293 }),
        st('Preliminary design received from Verizon', { r: 43329 }),
        st('Preliminary design sent to client for approval', { s: 43329 }),
        st('Reviewed and approved by client', { b: 43339 }),
        st('Send approval/revisions to Verizon for final', { f: 43339 }),
        st('Received final design from Verizon', { r: 43329 }),
        st('Send final design to client', { s: 43329 }),
      ],
      comment: 'Sent construction application to Luis Becerra on 7/12/2018. Copper is currently installed, FIOS is available as well. 7/17 Work order initiated to bring FIOS to Lots 1-22. Frontier requires $500 engineers deposit, waiting on check from client. Frontier has received check, application and all necessary files and will start design as of 8/1/2018.' },
    { name: 'Tract Design Specifications Agreement — Conduit & Hand-hole', state: 'done', steps: [
        st('Received from Verizon for signature', { r: 43329 }),
        st('Sent to client for signature', { s: 43329 }),
        st('Received back from client signed', { b: 43339 }),
        st('Sent signed original to Verizon', { f: 43339 }),
      ] },
    { name: 'New Construction Submittal — Lots 104-116 Zuni Ct', steps: [
        st('Submittal made to Verizon', { f: 43433 }),
        st('Preliminary design received from Verizon'),
        st('Preliminary design sent to client for approval'),
        st('Reviewed and approved by client'),
        st('Send approval/revisions to Verizon for final'),
        st('Received final design from Verizon'),
        st('Send final design to client'),
      ] },
    { name: 'Fee Letter · FTTP License · Easement · Bill of Sale · Wiring Specs', state: 'pending',
      steps: [st('Received from Verizon'), st('Sent to client'), st('Received back from client'), st('Sent to Verizon')],
      comment: '6 further document tracks on the form — none started yet.' },
  ],
  contracts: [
    { invoice: 'Proj. 70108-522590', invDate: 43329, td: '—', design: 'N/A',
      amount: 12374.48, amountLabel: '$12,374.48', paid: 43339,
      status: 'Balance is estimate of cost ($12,874.48) minus $500 Engineering Advance (already paid).' },
  ],
};

const TWC = {
  id: 'twc', utility: 'TWC', utilityFull: 'Time Warner Cable',
  track: 'Backbone', tag: 'TWC',
  groups: [
    { name: 'TWC Backbone Submittal', steps: [
        st('Submittal made to TWC', { f: 43298 }),
        st('Preliminary design received from TWC'),
        st('Send preliminary design to client for review'),
        st('Reviewed and approved by client'),
        st('Send approval/revisions to TWC for final'),
        st('Received final design from TWC'),
        st('Send final design to client'),
      ],
      comment: 'TWC contacts are Dale Shrivner and Scot Koehler. Per conversation with DS on 7/26 he had not received application. Resent on 7/26. Per Mike Pike, Dale Scrivner is aware of phasing and planning accordingly. 7/31' },
    { name: 'Fee Letter · Easement · Marketing Agreement · Bill of Sale · Wiring Specs', state: 'pending',
      steps: [st('Received from TWC'), st('Sent to client'), st('Received back from client'), st('Sent to TWC')],
      comment: '5 further document tracks plus phase notifications (15 phases) — none started yet.' },
  ],
  contracts: [],
};

// ==========================================================================
const JOB2417 = {
  code: '2417', name: 'Arroyos Desert Princess', client: 'Mike Pike',
  clientContact: 'Matt Dobson 909 635-4712, General Manager · Peter Varber Meyden 909 522-0051, Site Super',
  tracks: { SCE_R15, SCE_R16, GAS_BACKBONE, GAS_METERS, FRONTIER, TWC },
};

// Open items across the whole job (for board + alert views), derived live.
function openItems() {
  const items = [];
  const push = (track, woName, group, extra) => {
    const ball = deriveBall(group);
    if (ball.holder === 'utility' || ball.holder === 'client' || ball.holder === 'msa') {
      items.push({ track, woName, group, ball, days: waitDays(ball.since), ...extra });
    }
  };
  SCE_R15.workOrders.forEach((wo) => wo.groups.forEach((g) => push(SCE_R15, wo.name, g)));
  SCE_R16.workOrders.forEach((wo) => wo.state === 'open' && wo.steps && push(SCE_R16, wo.lots, { name: 'Rule 16 contract — ' + wo.lots, steps: wo.steps, reconcile: wo.reconcile }, { wo }));
  GAS_BACKBONE.groups.forEach((g) => push(GAS_BACKBONE, null, g));
  GAS_METERS.phases.forEach((p) => p.state !== 'done' && push(GAS_METERS, p.name, p));
  FRONTIER.groups.forEach((g) => push(FRONTIER, null, g));
  TWC.groups.forEach((g) => push(TWC, null, g));
  return items.sort((a, b) => (b.days || 0) - (a.days || 0));
}

Object.assign(window, {
  xlDate, xd, xdShort, ASOF, ASOF_LABEL, waitDays,
  deriveBall, BALL_META, JOB2417, openItems,
});
