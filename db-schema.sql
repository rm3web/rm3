CREATE EXTENSION ltree;

CREATE TABLE wh_entity (
	PRIMARY KEY(path),
	path ltree,
	stub boolean,
	hidden boolean,
	"entityId" uuid UNIQUE,
	"revisionId" uuid UNIQUE,
	"revisionNum" integer NOT NULL,
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
	"entityId" uuid,
	note text,
	"baseRevisionId" uuid,
	"replaceRevisionId" uuid,
	"revisionId" uuid,
	"revisionNum" integer,
	"evtStart" timestamp,
	"evtEnd" timestamp,
	"evtTouched" timestamp,
	"evtClass" text,
	"evtFinal" boolean,
	data json
);

CREATE TABLE wh_tag (
	"predPath" ltree,
	"objStr" text,
	"subjPath" ltree,
	"predClass" text
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
