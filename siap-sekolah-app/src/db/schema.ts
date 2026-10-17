/**
 * SIAP SEKOLAH — Drizzle ORM Schema (Cloudflare D1 / SQLite)
 *
 * Matches the TypeScript types in @/types exactly.
 * Run `npx drizzle-kit generate` to produce SQL migrations.
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── users ────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "evaluator", "teacher"] }).notNull(),
  pin_hash: text("pin_hash"),
  pos_number: integer("pos_number"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── batches ──────────────────────────────────────────────────────

export const batches = sqliteTable("batches", {
  id: text("id").primaryKey(),
  batch_name: text("batch_name").notNull(),
  batch_date: text("batch_date").notNull(),
  status: text("status", { enum: ["draft", "active", "locked"] })
    .notNull()
    .default("draft"),
  notes: text("notes"),
  created_by: text("created_by"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── students ─────────────────────────────────────────────────────

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  registration_no: text("registration_no").notNull().unique(),
  full_name: text("full_name").notNull(),
  nickname: text("nickname").notNull(),
  birth_date: text("birth_date").notNull(),
  gender: text("gender", { enum: ["L", "P"] }).notNull(),
  parent_name: text("parent_name"),
  phone: text("phone"),
  batch_id: text("batch_id"),
  observation_group: text("observation_group"),
  avatar_seed: text("avatar_seed"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── assessment_configs ───────────────────────────────────────────

export const assessmentConfigs = sqliteTable("assessment_configs", {
  id: text("id").primaryKey(),
  version: text("version").notNull().default("1.0.0"),
  pos_number: integer("pos_number").notNull(),
  pos_name: text("pos_name").notNull(),
  pos_description: text("pos_description"),
  indicators_json: text("indicators_json").notNull().default("[]"),
  red_flags_json: text("red_flags_json").notNull().default("[]"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_by: text("created_by"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── evaluations ──────────────────────────────────────────────────

export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  student_id: text("student_id").notNull(),
  batch_id: text("batch_id").notNull(),
  pos_number: integer("pos_number").notNull(),
  evaluator_id: text("evaluator_id").notNull(),
  config_id: text("config_id"),
  scores_json: text("scores_json").notNull().default("{}"),
  reading_level: text("reading_level", { enum: ["L1", "L2", "L3", "L4"] }),
  red_flags_json: text("red_flags_json").notNull().default("{}"),
  has_red_flag: integer("has_red_flag", { mode: "boolean" })
    .notNull()
    .default(false),
  anecdotal_note: text("anecdotal_note"),
  total_score: real("total_score"),
  is_complete: integer("is_complete", { mode: "boolean" })
    .notNull()
    .default(false),
  client_id: text("client_id"),
  synced_at: text("synced_at"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── class_placements ─────────────────────────────────────────────

export const classPlacements = sqliteTable("class_placements", {
  id: text("id").primaryKey(),
  student_id: text("student_id").notNull(),
  batch_id: text("batch_id").notNull(),
  assigned_class: text("assigned_class", { enum: ["1A", "1B"] }).notNull(),
  algorithm_version: text("algorithm_version").notNull().default("v1.0"),
  balance_score: real("balance_score"),
  manual_override: integer("manual_override", { mode: "boolean" })
    .notNull()
    .default(false),
  override_by: text("override_by"),
  override_reason: text("override_reason"),
  override_at: text("override_at"),
  assigned_at: text("assigned_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

// ─── parent_responses ─────────────────────────────────────────────

export const parentResponses = sqliteTable("parent_responses", {
  id: text("id").primaryKey(),
  student_id: text("student_id").notNull(),
  batch_id: text("batch_id").notNull(),
  responses_json: text("responses_json").notNull().default("{}"),
  submitted_at: text("submitted_at").notNull(),
});
