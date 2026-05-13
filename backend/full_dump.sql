--
-- PostgreSQL database dump
--

\restrict t5rhYvIiCOnXn1O2S8rfVKMZLU4INUkxGNCyfl3reLMseo1BurCuv57AP6ozY09

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
    view_count integer DEFAULT 0,
    title character varying(60),
    note character varying(140)
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
sCkVGj	2026-05-10 23:43:21.905784
oo14Q6	2026-05-13 09:12:02.48221
gNzTh6	2026-05-13 09:41:00.327091
JUR7td	2026-05-13 09:43:36.152845
\.


--
-- Data for Name: snippets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.snippets (id, short_id, content, language, expiry_at, created_at, password_hash, burn_after_read, download_enabled, manage_token, view_count, title, note) FROM stdin;
39	PjcVnk	3rf3f3wfergerg	javascript	2026-05-14 09:13:22.35	2026-05-13 09:13:22.435878	$2b$10$hakh08Hghy/MO2R35F7VY.0EwUozh29xc3Wdb2NcyitXj0O2RMfGy	f	f	YT2lHJoljjSbaiXO11SrxmD0vexDhqwq	1	\N	\N
\.


--
-- Name: snippets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.snippets_id_seq', 41, true);


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

\unrestrict t5rhYvIiCOnXn1O2S8rfVKMZLU4INUkxGNCyfl3reLMseo1BurCuv57AP6ozY09

