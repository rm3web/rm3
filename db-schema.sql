CREATE EXTENSION ltree;

CREATE TABLE wh_entity (
	path ltree UNIQUE,
	stub boolean,
	entity_id uuid UNIQUE,
	revision_id uuid UNIQUE,
	revision_num integer NOT NULL,
	proto text,
	modified timestamp,
	created timestamp,
	summary json,
	data json
);

CREATE TABLE wh_log (
	path ltree,
	note text,
	base_revision_id uuid,
	replace_revision_id uuid,
	revision_num integer,
	revision_id uuid,
	evt_start timestamp,
	evt_end timestamp,
	evt_touched timestamp,
	data json
);

CREATE TABLE wh_tag (
	pred_path ltree,
	obj_str text,
	subj_path ltree,
	pred_class text,
	tag_id uuid UNIQUE
);