--
-- PostgreSQL database dump
--

\restrict uZhFb2h0c9E8musHuQ4fCBqE6zTd0zvFn0vf4X0nk7UI6gr1xz5aIeFUuzA2re7

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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
-- Name: destroyed_snippets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.destroyed_snippets (
    short_id character varying(6) NOT NULL,
    destroyed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.destroyed_snippets OWNER TO postgres;

--
-- Name: snippets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.snippets (
    id integer NOT NULL,
    short_id character varying(6) NOT NULL,
    content text NOT NULL,
    language character varying(50),
    expiry_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    password_hash character varying(255),
    burn_after_read boolean DEFAULT false,
    download_enabled boolean DEFAULT true NOT NULL,
    manage_token character varying(32),
    view_count integer DEFAULT 0
);


ALTER TABLE public.snippets OWNER TO postgres;

--
-- Name: snippets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.snippets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.snippets_id_seq OWNER TO postgres;

--
-- Name: snippets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.snippets_id_seq OWNED BY public.snippets.id;


--
-- Name: snippets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snippets ALTER COLUMN id SET DEFAULT nextval('public.snippets_id_seq'::regclass);


--
-- Data for Name: destroyed_snippets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.destroyed_snippets (short_id, destroyed_at) FROM stdin;
CSiIuL	2026-05-10 13:27:05.642616
XW4xLl	2026-05-10 22:28:34.480471
uGAbBk	2026-05-10 22:32:04.626128
Nqlq7d	2026-05-10 22:36:21.612107
L7ENVH	2026-05-10 23:00:10.360491
\.


--
-- Data for Name: snippets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.snippets (id, short_id, content, language, expiry_at, created_at, password_hash, burn_after_read, download_enabled, manage_token, view_count) FROM stdin;
1	yDzbkF	console.log('Hello SnipShare')	javascript	2026-05-10 23:37:02.795	2026-05-09 23:37:02.844252	\N	f	t	\N	0
2	GUhCXT	CREATE TABLE snippets (\n    id SERIAL PRIMARY KEY,\n    short_id VARCHAR(6) UNIQUE NOT NULL,\n    content TEXT NOT NULL,\n    language VARCHAR(50),\n    expiry_at TIMESTAMP,\n    created_at TIMESTAMP DEFAULT NOW()\n);	sql	2026-05-10 00:45:00.784	2026-05-09 23:45:00.8137	\N	f	t	\N	0
3	djJgrC	feqrfefqerfefqrfecfc	plaintext	2026-05-10 23:46:24.954	2026-05-09 23:46:25.091308	\N	f	t	\N	0
4	qlG0pa	res.setHeader("Content-Type", "text/plain");\nres.send(snippet.content);	javascript	2026-05-10 23:52:00.701	2026-05-09 23:52:00.838748	\N	f	t	\N	0
5	vW1mcA	res.setHeader("Content-Type", "text/plain");\nres.send(snippet.content);	javascript	2026-05-10 23:53:43.413	2026-05-09 23:53:43.461693	\N	f	t	\N	0
6	ZFj8R6	awewewqefqewrfeq	plaintext	2026-05-10 00:58:27.842	2026-05-09 23:58:27.887051	\N	f	t	\N	0
7	5op8F6	ferfqefqrfqefqerfewgtebwtrggtgw	javascript	2026-05-11 00:07:17.665	2026-05-10 00:07:17.69518	\N	f	t	\N	0
8	TcSLsy	console.log('Hello SnipShare')	javascript	2026-05-11 00:28:42.534	2026-05-10 00:28:42.763837	$2b$10$oruUMDt5O8JdKxKhSak.gep8wLwk9b973OKlm410E7NXsNmWzMKJG	f	t	\N	0
9	yilGo7	rfqwewefwef	javascript	2026-05-11 00:34:23.099	2026-05-10 00:34:23.143683	\N	f	t	\N	0
10	SJ0HDF	deewdewdwdew	javascript	2026-05-10 01:35:08.212	2026-05-10 00:35:08.257913	\N	f	t	\N	0
11	Eon3EC	wfqerferqrfqrf	plaintext	2026-05-10 01:41:23.92	2026-05-10 00:41:24.117647	$2b$10$z1oe67.HKrrF0lbzPQWBp.xpU0n7YYdFr/KIFuptk5hpA.P.av/wu	f	t	\N	0
12	IHysy0	qrwefrefqerf	javascript	2026-05-11 00:42:36.669	2026-05-10 00:42:36.752468	$2b$10$fWBAxM1M9u/BBeAkKyeoquK7ysBjyIsvZCcEW9oYbUFKxFBpRF4oW	f	t	\N	0
13	QqgpVm	wfqwefqwerfqrfrqef	javascript	2026-05-11 00:48:37.18	2026-05-10 00:48:37.383467	$2b$10$vU8lygts9GJHP/pvzNfAiu3k9424AQaEHYw80F0mE8ZzIDiGhrAIi	f	t	\N	0
14	q61vhS	Create a new endpoint:\n\nPOST /api/snippets/:shortId/verify\n\nRequirements:\n- Accept "password" in body\n- Compare with password_hash using bcrypt.compare\n- If correct:\n  - Return full snippet content\n- If wrong:\n  - Return 401 "Invalid password"\n\nAdd this in:\n- routes\n- controller\n- service	javascript	2026-05-10 01:53:50.511	2026-05-10 00:53:50.614152	$2b$10$DFF6dTqZ9CF4.rIwN5nOOuQItggPanwIZhs1oCTzqZnG.4n9kLHJe	f	t	\N	0
15	gl1gGW	if 5 > 2:\n print("Five is greater than two!") \nif 5 > 2:\n        print("Five is greater than two!") \n	python	2026-05-10 12:37:54.878	2026-05-10 11:37:54.99869	$2b$10$cSYLkt4h2TEJn6OecyRrFOLGZXjbk0n6VcsAGvHIUxzEdSecz4MyK	f	t	\N	0
16	x7HV1K	wefweaafawef	javascript	2026-05-11 11:38:48.42	2026-05-10 11:38:48.452206	\N	f	t	\N	0
17	CEWYuQ	ewdwedwdwed	javascript	2026-05-11 11:39:21.417	2026-05-10 11:39:21.503447	$2b$10$fAZIPV9nLdHIuInSDzYqk.xd/9UKKReGITgbmf0onhLUipmIFF.he	f	t	\N	0
19	vQjkCV	wdqwefqewfdqw	plaintext	2026-05-11 13:27:33.499	2026-05-10 13:27:33.532199	\N	f	t	\N	0
20	3piR3l	if 5 > 2:\n print("Five is greater than two!")\n        print("Five is greater than two!")\n	python	2026-05-10 15:39:55.86	2026-05-10 14:39:55.997099	\N	f	t	\N	0
21	cS9Efm	wfqwefewfqr	javascript	2026-05-10 23:20:28.353	2026-05-10 22:20:28.4017	\N	f	t	\N	0
22	t1dYzs	egreferfraeaee	javascript	2026-05-10 22:51:26.888	2026-05-10 22:27:27.03257	\N	f	t	\N	0
26	6MWu3M	frfrffqferfeewrfwrf	javascript	2026-05-11 22:56:36.608	2026-05-10 22:56:36.653419	\N	f	t	rYxjBAkGgyuW9pBtBdDJ0uvpC1GjUcRB	0
27	GeZejA	wdqwecqewc	javascript	2026-05-11 22:57:17.342	2026-05-10 22:57:17.432533	$2b$10$TzZ.mo7TWQ3JuEb/v7FauOnAplNhnW1u/0icOtx8vEA92QnRc1fKC	f	f	WvL2V4De7EyJ5oId0ofe12Hq7tXqQP7p	1
29	d7buSz	fevevfeverv	javascript	2026-05-11 23:01:43.716	2026-05-10 23:01:43.854344	\N	f	f	3k8U6rJSZXCEJ0ElUh0iiYaDCVZPVA3S	0
30	psFYcU	dcedcqecqec	javascript	2026-05-11 23:02:03.514	2026-05-10 23:02:03.552032	\N	f	t	OdOjCvpRRwQMgfcp0Xmw460IOKvPwsOM	0
32	lCFfxd	hbjhbkjnkjn	javascript	2026-05-11 23:13:26.227	2026-05-10 23:13:26.367661	\N	f	t	aYVQ1InBbxBW2eSLlNrpCHORdP4QQL4S	0
33	6Dodmx	dcwdwecwed	javascript	2026-05-11 23:17:24.879	2026-05-10 23:17:24.90973	\N	f	t	VMToisr5L3FtzKxCPc2ZCgyyjWHD1nmV	0
34	0hyC7E	lkmlmkmlkm	javascript	2026-05-11 00:21:39.799	2026-05-10 23:21:39.832228	\N	f	t	lBwQny9wLewKBf3zKsCuhE4Yin5sw1yr	2
35	H3yvOG	kjbkjnjkj	javascript	2026-05-11 23:23:02.091	2026-05-10 23:23:02.092066	\N	f	t	lxRpnAxnf2DxmLuexIPUYDjoGlYYFLCv	0
\.


--
-- Name: snippets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.snippets_id_seq', 35, true);


--
-- Name: destroyed_snippets destroyed_snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destroyed_snippets
    ADD CONSTRAINT destroyed_snippets_pkey PRIMARY KEY (short_id);


--
-- Name: snippets snippets_manage_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_manage_token_key UNIQUE (manage_token);


--
-- Name: snippets snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_pkey PRIMARY KEY (id);


--
-- Name: snippets snippets_short_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_short_id_key UNIQUE (short_id);


--
-- PostgreSQL database dump complete
--

\unrestrict uZhFb2h0c9E8musHuQ4fCBqE6zTd0zvFn0vf4X0nk7UI6gr1xz5aIeFUuzA2re7

