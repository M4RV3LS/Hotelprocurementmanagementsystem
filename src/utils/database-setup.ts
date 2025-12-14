/**
 * Database Setup Utility
 * 
 * This utility helps initialize the Supabase database with the schema
 * and seed data. Run this once to set up your database.
 */

import { createClient } from "@jsr/supabase__supabase-js";
import { projectId, publicAnonKey } from "./supabase/info";
import { initializeDatabase } from "./api";
import { initialRequests, initialVendors, initialItems } from "../data/seedData";