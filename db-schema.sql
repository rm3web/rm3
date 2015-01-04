CREATE EXTENSION ltree;

CREATE TABLE wh_entity (
	PRIMARY KEY(path),
	path ltree,
	stub boolean,
	hidden boolean,
	entity_id uuid UNIQUE,
	revision_id uuid UNIQUE,
	revision_num integer NOT NULL,
	proto text,
	modified timestamp,
	created timestamp,
	touched timestamp,
	summary json,
	data json,
	tags json
);

CREATE TABLE wh_log (
	path ltree,
	entity_id uuid,
	note text,
	base_revision_id uuid,
	replace_revision_id uuid,
	revision_id uuid,
	revision_num integer,
	evt_start timestamp,
	evt_end timestamp,
	evt_touched timestamp,
	evt_class text,
	evt_final boolean,
	data json
);

CREATE TABLE wh_tag (
	pred_path ltree REFERENCES wh_entity (path) ON DELETE CASCADE,
	obj_str text,
	subj_path ltree REFERENCES wh_entity (path) ON DELETE CASCADE,
	pred_class text,
	tag_id uuid UNIQUE
);

CREATE TABLE wh_permission_to_role (
	PRIMARY KEY(role, permission, path),
  role text,
  permission text,
  path text,
  query lquery
);

CREATE INDEX wh_permission_role_idx ON wh_permission_to_role USING BTREE (role);
CREATE INDEX wh_permission_idx ON wh_permission_to_role USING BTREE (permission);

CREATE TABLE wh_subject_to_roles (
  PRIMARY KEY(subject,role),
  subject ltree REFERENCES wh_entity (path) ON DELETE CASCADE,
  role text
);

CREATE INDEX wh_subject_to_roles_gist_idx ON wh_subject_to_roles USING GIST (subject);
CREATE INDEX wh_subject_role_idx ON wh_subject_to_roles USING BTREE (role);
