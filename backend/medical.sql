--
-- PostgreSQL database dump
--

\restrict 2z2ocOit6Iy0OzIfL4gkgNaaXHyRZP6EOGUh8UIykH392cFG3Dfyxqr5vUIvVVG

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

-- Started on 2026-08-05 15:44:33

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 24730)
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_recommendations (
    id text NOT NULL,
    type text NOT NULL,
    target_entity_type text NOT NULL,
    target_entity_id text NOT NULL,
    recommendation_data text NOT NULL,
    confidence_score real NOT NULL,
    explanation text NOT NULL,
    status text DEFAULT 'Pending Review'::text,
    model_version text NOT NULL,
    reviewer_id text,
    reviewer_decision text,
    override_reason text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_recommendations OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24744)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    prev_value text,
    new_value text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address text
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24708)
-- Name: capas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capas (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    source_type text NOT NULL,
    source_id text NOT NULL,
    status text DEFAULT 'Open'::text,
    assigned_to text,
    aging_days integer DEFAULT 0,
    target_completion_date date,
    completed_date date
);


ALTER TABLE public.capas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24695)
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    id text NOT NULL,
    item_id text NOT NULL,
    lot_number text NOT NULL,
    complaint_date date NOT NULL,
    description text,
    severity text NOT NULL,
    status text DEFAULT 'Open'::text,
    resolution text
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24647)
-- Name: demand_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demand_history (
    id text NOT NULL,
    item_id text NOT NULL,
    date date NOT NULL,
    quantity_demanded integer NOT NULL,
    yield_rate real DEFAULT 100.0,
    defect_rate real DEFAULT 0.0,
    complaint_rate real DEFAULT 0.0,
    uptime_percentage real DEFAULT 100.0,
    service_turnaround_days real DEFAULT 0.0
);


ALTER TABLE public.demand_history OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24664)
-- Name: forecasts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forecasts (
    id text NOT NULL,
    item_id text NOT NULL,
    forecast_date date NOT NULL,
    forecasted_quantity integer NOT NULL,
    confidence_score real DEFAULT 0.0,
    explanation text,
    model_version text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.forecasts OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24678)
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id text NOT NULL,
    item_id text NOT NULL,
    lot_number text NOT NULL,
    inspector_id text NOT NULL,
    inspection_date date NOT NULL,
    quantity_inspected integer NOT NULL,
    quantity_passed integer NOT NULL,
    quantity_failed integer NOT NULL,
    defect_type text,
    status text NOT NULL
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24597)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id text NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    description text,
    current_stock integer DEFAULT 0,
    safety_stock integer DEFAULT 0,
    lead_time_days integer DEFAULT 7,
    location text NOT NULL,
    bin text,
    lot_number text,
    expiry_date date,
    age_days integer DEFAULT 0,
    reserved_quantity integer DEFAULT 0,
    open_orders integer DEFAULT 0,
    unit_cost numeric(12,2) DEFAULT 0.0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24757)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    severity text DEFAULT 'Low'::text,
    is_read boolean DEFAULT false,
    related_entity_type text,
    related_entity_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24795)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    purchase_request_id text,
    po_number text NOT NULL,
    status text NOT NULL,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_cost numeric(12,2)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 24589)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24772)
-- Name: purchase_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_requests (
    id text NOT NULL,
    item_id text NOT NULL,
    supplier_id text NOT NULL,
    quantity integer NOT NULL,
    estimated_cost numeric(12,2),
    status text NOT NULL,
    request_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviewer_id text,
    override_reason text
);


ALTER TABLE public.purchase_requests OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24722)
-- Name: risks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.risks (
    id text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    likelihood integer NOT NULL,
    impact integer NOT NULL,
    score integer NOT NULL,
    mitigation_plan text,
    status text DEFAULT 'Open'::text
);


ALTER TABLE public.risks OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24629)
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    item_id text NOT NULL,
    type text NOT NULL,
    quantity integer NOT NULL,
    source_location text,
    dest_location text,
    reference_id text,
    actor_id text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24615)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    name text NOT NULL,
    contact_email text NOT NULL,
    quality_score real DEFAULT 100.0,
    delivery_reliability real DEFAULT 100.0,
    risk_score real DEFAULT 0.0,
    lead_time_days integer DEFAULT 7,
    status text DEFAULT 'Qualified'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 24577)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    status text DEFAULT 'Active'::text,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5048 (class 0 OID 24730)
-- Dependencies: 228
-- Data for Name: ai_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_recommendations (id, type, target_entity_type, target_entity_id, recommendation_data, confidence_score, explanation, status, model_version, reviewer_id, reviewer_decision, override_reason, "timestamp") FROM stdin;
rec1	Reorder	item	i1	{"reorder_quantity":80,"supplier_id":"s1","cost_estimate":3600}	0.92	Oxygen Flow Sensor is below safety stock threshold (120 vs safety 150). Recommended order: 80 units from BioSensors Inc.	Pending Review	Gemini 3.5 Pro V1	\N	\N	\N	2026-08-05 10:54:07.76545
rec2	Transfer	item	i4	{"transfer_quantity":10,"source":"Warehouse B","destination":"Warehouse A"}	0.85	Optimise ventilator backup battery pack layout by transferring 10 excess units from Warehouse B to A.	Pending Review	Gemini 3.5 Pro V1	\N	\N	\N	2026-08-05 10:54:07.767342
rec3	Supplier Risk	supplier	s3	{"warning":"High risk detected","factor":"Quality score dropped to 82.3%"}	0.78	Apex Spare Parts flagged under review due to increased defect rate in recent spare parts shipments.	Pending Review	Gemini 3.5 Pro V1	\N	\N	\N	2026-08-05 10:54:07.768052
\.


--
-- TOC entry 5049 (class 0 OID 24744)
-- Dependencies: 229
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, prev_value, new_value, "timestamp", ip_address) FROM stdin;
audit_jxwxoo8ci	u2	LOGIN	user	u2	\N	\N	2026-08-05 12:23:06.991095	\N
audit_ufa44g9kl	u2	LOGIN	user	u2	\N	\N	2026-08-05 12:34:02.082762	\N
audit_7gd3y8gq0	u2	LOGIN	user	u2	\N	\N	2026-08-05 14:38:31.182284	\N
audit_8q6nf1joh	u2	LOGIN	user	u2	\N	\N	2026-08-05 14:38:38.87773	\N
\.


--
-- TOC entry 5046 (class 0 OID 24708)
-- Dependencies: 226
-- Data for Name: capas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.capas (id, title, description, source_type, source_id, status, assigned_to, aging_days, target_completion_date, completed_date) FROM stdin;
capa1	Recalibration of Sensor Test Bench	Improve calibration precision to resolve flow fluctuations.	Customer Complaint	c1	In Progress	u2	10	2026-08-15	\N
capa2	Packaging Batch Redesign	Rectify sterile bag puncture issue detected in MedPack global delivery.	Inspection Failure	ins2	Open	u1	5	2026-08-20	\N
\.


--
-- TOC entry 5045 (class 0 OID 24695)
-- Dependencies: 225
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, item_id, lot_number, complaint_date, description, severity, status, resolution) FROM stdin;
c1	i1	LOT-99882	2026-07-25	Flow rate fluctuation reported during hospital ventilation check.	High	Investigating	Calibration validation in progress.
c2	i4	LOT-66551	2026-07-29	Battery failed to hold charge beyond 4 hours (specified 6 hrs).	Medium	Open	\N
\.


--
-- TOC entry 5042 (class 0 OID 24647)
-- Dependencies: 222
-- Data for Name: demand_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demand_history (id, item_id, date, quantity_demanded, yield_rate, defect_rate, complaint_rate, uptime_percentage, service_turnaround_days) FROM stdin;
dh_i6_2025-09	i6	2025-09-01	12	97.8	2.2	0.4	99.5	10
dh_i6_2025-10	i6	2025-10-01	10	97.8	2.2	0.4	99.5	10
dh_i6_2025-11	i6	2025-11-01	12	97.8	2.2	0.4	99.5	10
dh_i6_2025-12	i6	2025-12-01	13	97.8	2.2	0.4	99.5	10
dh_i6_2026-01	i6	2026-01-01	10	97.8	2.2	0.4	99.5	10
dh_i6_2026-02	i6	2026-02-01	10	97.8	2.2	0.4	99.5	10
dh_i6_2026-03	i6	2026-03-01	13	97.8	2.2	0.4	99.5	10
dh_i6_2026-04	i6	2026-04-01	13	97.8	2.2	0.4	99.5	10
dh_i6_2026-05	i6	2026-05-01	13	97.8	2.2	0.4	99.5	10
dh_i6_2026-06	i6	2026-06-01	11	97.8	2.2	0.4	99.5	10
dh_i6_2026-07	i6	2026-07-01	10	97.8	2.2	0.4	99.5	10
dh_i1_2025-08	i1	2025-08-01	91	98.5	1.5	0.2	99.2	3.5
dh_i1_2025-09	i1	2025-09-01	120	98.5	1.5	0.2	99.2	3.5
dh_i1_2025-10	i1	2025-10-01	117	98.5	1.5	0.2	99.2	3.5
dh_i1_2025-11	i1	2025-11-01	93	98.5	1.5	0.2	99.2	3.5
dh_i1_2025-12	i1	2025-12-01	78	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-01	i1	2026-01-01	76	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-02	i1	2026-02-01	84	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-03	i1	2026-03-01	109	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-04	i1	2026-04-01	112	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-05	i1	2026-05-01	106	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-06	i1	2026-06-01	86	98.5	1.5	0.2	99.2	3.5
dh_i1_2026-07	i1	2026-07-01	83	98.5	1.5	0.2	99.2	3.5
dh_i4_2025-08	i4	2025-08-01	27	99.1	0.9	0.1	98.7	5
dh_i4_2025-09	i4	2025-09-01	27	99.1	0.9	0.1	98.7	5
dh_i4_2025-10	i4	2025-10-01	27	99.1	0.9	0.1	98.7	5
dh_i4_2025-11	i4	2025-11-01	20	99.1	0.9	0.1	98.7	5
dh_i4_2025-12	i4	2025-12-01	27	99.1	0.9	0.1	98.7	5
dh_i4_2026-01	i4	2026-01-01	23	99.1	0.9	0.1	98.7	5
dh_i4_2026-02	i4	2026-02-01	22	99.1	0.9	0.1	98.7	5
dh_i4_2026-03	i4	2026-03-01	23	99.1	0.9	0.1	98.7	5
dh_i4_2026-04	i4	2026-04-01	20	99.1	0.9	0.1	98.7	5
dh_i4_2026-05	i4	2026-05-01	24	99.1	0.9	0.1	98.7	5
dh_i4_2026-06	i4	2026-06-01	20	99.1	0.9	0.1	98.7	5
dh_i4_2026-07	i4	2026-07-01	20	99.1	0.9	0.1	98.7	5
dh_i6_2025-08	i6	2025-08-01	11	97.8	2.2	0.4	99.5	10
\.


--
-- TOC entry 5043 (class 0 OID 24664)
-- Dependencies: 223
-- Data for Name: forecasts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forecasts (id, item_id, forecast_date, forecasted_quantity, confidence_score, explanation, model_version, created_at) FROM stdin;
f1	i1	2026-08-01	115	0.88	AI demand forecast based on standard seasonal trend and low defect rates.	V1.0.2	2026-08-05 10:53:39.54725
f2	i4	2026-08-01	28	0.82	Slightly higher projected demand due to upcoming preventative maintenance cycles.	V1.0.2	2026-08-05 10:53:39.549348
f3	i6	2026-08-01	14	0.91	Forecast matching the stable client order book for Q3.	V1.0.2	2026-08-05 10:53:39.550137
\.


--
-- TOC entry 5044 (class 0 OID 24678)
-- Dependencies: 224
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, item_id, lot_number, inspector_id, inspection_date, quantity_inspected, quantity_passed, quantity_failed, defect_type, status) FROM stdin;
ins1	i1	LOT-99882	u3	2026-07-28	50	48	2	Slight scale deviation	Passed
ins2	i3	LOT-77123	u3	2026-07-30	20	12	8	Sterile bag puncture	Failed
\.


--
-- TOC entry 5039 (class 0 OID 24597)
-- Dependencies: 219
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, sku, category, unit, description, current_stock, safety_stock, lead_time_days, location, bin, lot_number, expiry_date, age_days, reserved_quantity, open_orders, unit_cost, created_at, updated_at) FROM stdin;
i1	Oxygen Flow Sensor	SKU-SN-001	sensors	units	High-precision oxygen flow sensor for ventilators.	120	150	5	Warehouse A	A-12	LOT-99882	2027-12-31	45	10	50	45.00	2026-08-05 10:53:39.516144	2026-08-05 10:53:39.516144
i2	ECG Lead Cable 5-Lead	SKU-CP-002	components	units	Shielded 5-lead ECG trunk cable.	450	200	8	Warehouse A	B-04	LOT-88273	2028-06-15	12	0	0	75.00	2026-08-05 10:53:39.520267	2026-08-05 10:53:39.520267
i3	Sterile Device Outer Shell Packaging	SKU-PK-003	packaging	box	Validated sterile barrier packaging box.	80	100	10	Warehouse B	C-01	LOT-77123	2026-12-01	90	15	120	12.50	2026-08-05 10:53:39.521208	2026-08-05 10:53:39.521208
i4	Ventilator Backup Battery Pack	SKU-SP-004	spare parts	units	Rechargeable Li-ion backup battery pack.	35	50	15	Warehouse A	D-15	LOT-66551	2028-01-10	110	5	20	180.00	2026-08-05 10:53:39.522092	2026-08-05 10:53:39.522092
i5	Calibration Gas Cylinder (N2/CO2)	SKU-CM-005	calibration materials	units	Mixed calibration gas cylinder for blood gas analysers.	15	20	7	Warehouse B	GAS-02	LOT-55443	2026-09-30	210	2	10	120.00	2026-08-05 10:53:39.523214	2026-08-05 10:53:39.523214
i6	Portable Cardiac Monitor V4	SKU-FD-006	finished devices	units	Fully assembled portable patient cardiac monitor.	28	15	12	Warehouse A	F-08	LOT-44332	2029-05-20	5	8	0	1200.00	2026-08-05 10:53:39.524037	2026-08-05 10:53:39.524037
\.


--
-- TOC entry 5050 (class 0 OID 24757)
-- Dependencies: 230
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, severity, is_read, related_entity_type, related_entity_id, created_at) FROM stdin;
n1	u1	Critical Safety Stock Alert	Oxygen Flow Sensor (SKU-SN-001) has dropped below safety stock!	Alert	High	f	item	i1	2026-08-05 10:54:07.768738
n2	u2	New AI Reorder Recommendation	Reorder 80 units of Oxygen Flow Sensor proposed.	Recommendation	Medium	f	ai_recommendation	rec1	2026-08-05 10:54:07.771722
n3	u1	CAPA Deadline Approaching	Packaging Batch Redesign CAPA is due in 15 days.	Action Required	Medium	f	capa	capa2	2026-08-05 10:54:07.77283
\.


--
-- TOC entry 5052 (class 0 OID 24795)
-- Dependencies: 232
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, purchase_request_id, po_number, status, order_date, total_cost) FROM stdin;
\.


--
-- TOC entry 5038 (class 0 OID 24589)
-- Dependencies: 218
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, created_at) FROM stdin;
\.


--
-- TOC entry 5051 (class 0 OID 24772)
-- Dependencies: 231
-- Data for Name: purchase_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_requests (id, item_id, supplier_id, quantity, estimated_cost, status, request_date, reviewer_id, override_reason) FROM stdin;
\.


--
-- TOC entry 5047 (class 0 OID 24722)
-- Dependencies: 227
-- Data for Name: risks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.risks (id, category, description, likelihood, impact, score, mitigation_plan, status) FROM stdin;
r1	Supply Chain	Lead time spike due to sensor manufacturer customs delays.	4	3	12	Diversify supply to European distributors.	Open
r2	Quality	Aging inventory of Sterile packaging (expires Dec 2026).	3	4	12	Expedite first-in-first-out usage workflow.	Open
\.


--
-- TOC entry 5041 (class 0 OID 24629)
-- Dependencies: 221
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, item_id, type, quantity, source_location, dest_location, reference_id, actor_id, "timestamp") FROM stdin;
sm1	i1	Receipt	50	s1	Warehouse A	PO-9911	u3	2026-07-28 10:15:00
sm2	i4	Issue	5	Warehouse A	Service Center	SRV-8822	u3	2026-08-01 14:30:00
sm3	i6	Transfer	2	Warehouse A	Warehouse B	TR-0044	u3	2026-08-02 09:00:00
\.


--
-- TOC entry 5040 (class 0 OID 24615)
-- Dependencies: 220
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, contact_email, quality_score, delivery_reliability, risk_score, lead_time_days, status, created_at, updated_at) FROM stdin;
s1	BioSensors Inc.	orders@biosensors.com	96.5	98.2	1.2	5	Qualified	2026-08-05 10:53:39.511328	2026-08-05 10:53:39.511328
s2	MedPack Global	supply@medpack.com	99.1	94.5	2.5	10	Qualified	2026-08-05 10:53:39.512976	2026-08-05 10:53:39.512976
s3	Apex Spare Parts	support@apexparts.com	82.3	85	5.8	15	Under Review	2026-08-05 10:53:39.513848	2026-08-05 10:53:39.513848
s4	CalibraTech	info@calibratech.com	95	97	1.8	7	Qualified	2026-08-05 10:53:39.514877	2026-08-05 10:53:39.514877
\.


--
-- TOC entry 5037 (class 0 OID 24577)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, first_name, last_name, status, last_login, created_at, updated_at) FROM stdin;
u1	procurement_mgr@hospital.com	$2a$08$mBgQoejxiZny347uGq3JKOfQlL2lIpZ2u9nAnoHLjRAQ/puzhjAP.	Procurement Manager	Priya	Sharma	Active	\N	2026-08-05 10:53:39.505116	2026-08-05 10:53:39.505116
u3	warehouse_user@hospital.com	$2a$08$mBgQoejxiZny347uGq3JKOfQlL2lIpZ2u9nAnoHLjRAQ/puzhjAP.	Warehouse User	Karthik	Nair	Active	\N	2026-08-05 10:53:39.509598	2026-08-05 10:53:39.509598
u4	supplier_user@hospital.com	$2a$08$mBgQoejxiZny347uGq3JKOfQlL2lIpZ2u9nAnoHLjRAQ/puzhjAP.	Supplier	Meera	Iyer	Active	\N	2026-08-05 10:53:39.510272	2026-08-05 10:53:39.510272
u5	finance_reviewer@hospital.com	$2a$08$mBgQoejxiZny347uGq3JKOfQlL2lIpZ2u9nAnoHLjRAQ/puzhjAP.	Finance Reviewer	Ananya	Gupta	Active	\N	2026-08-05 10:53:39.510878	2026-08-05 10:53:39.510878
u2	inventory_planner@hospital.com	$2a$08$mBgQoejxiZny347uGq3JKOfQlL2lIpZ2u9nAnoHLjRAQ/puzhjAP.	Inventory Planner	Arjun	Reddy	Active	2026-08-05 14:38:38.873802	2026-08-05 10:53:39.508816	2026-08-05 10:53:39.508816
\.


--
-- TOC entry 4868 (class 2606 OID 24738)
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 24751)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 24716)
-- Name: capas capas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas
    ADD CONSTRAINT capas_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 24702)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 24658)
-- Name: demand_history demand_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demand_history
    ADD CONSTRAINT demand_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 24672)
-- Name: forecasts forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecasts
    ADD CONSTRAINT forecasts_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 24684)
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 24612)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 24614)
-- Name: items items_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_sku_key UNIQUE (sku);


--
-- TOC entry 4872 (class 2606 OID 24766)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 24802)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 24596)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 24779)
-- Name: purchase_requests purchase_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 24729)
-- Name: risks risks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.risks
    ADD CONSTRAINT risks_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 24636)
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 24628)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 24588)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4844 (class 2606 OID 24586)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 24739)
-- Name: ai_recommendations ai_recommendations_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- TOC entry 4886 (class 2606 OID 24752)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4884 (class 2606 OID 24717)
-- Name: capas capas_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capas
    ADD CONSTRAINT capas_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- TOC entry 4883 (class 2606 OID 24703)
-- Name: complaints complaints_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4879 (class 2606 OID 24659)
-- Name: demand_history demand_history_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demand_history
    ADD CONSTRAINT demand_history_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4880 (class 2606 OID 24673)
-- Name: forecasts forecasts_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecasts
    ADD CONSTRAINT forecasts_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4881 (class 2606 OID 24690)
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id);


--
-- TOC entry 4882 (class 2606 OID 24685)
-- Name: inspections inspections_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4887 (class 2606 OID 24767)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4891 (class 2606 OID 24803)
-- Name: orders orders_purchase_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_purchase_request_id_fkey FOREIGN KEY (purchase_request_id) REFERENCES public.purchase_requests(id);


--
-- TOC entry 4888 (class 2606 OID 24780)
-- Name: purchase_requests purchase_requests_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4889 (class 2606 OID 24790)
-- Name: purchase_requests purchase_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- TOC entry 4890 (class 2606 OID 24785)
-- Name: purchase_requests purchase_requests_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 4877 (class 2606 OID 24642)
-- Name: stock_movements stock_movements_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- TOC entry 4878 (class 2606 OID 24637)
-- Name: stock_movements stock_movements_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


-- Completed on 2026-08-05 15:44:33

--
-- PostgreSQL database dump complete
--

\unrestrict 2z2ocOit6Iy0OzIfL4gkgNaaXHyRZP6EOGUh8UIykH392cFG3Dfyxqr5vUIvVVG
