import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  real,
  date,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('passwordHash'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const skinPhotos = pgTable('skinPhotos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').references(() => users.id),
  frontImageUrl: text('frontImageUrl').notNull(),
  leftImageUrl: text('leftImageUrl').notNull(),
  rightImageUrl: text('rightImageUrl').notNull(),
  takenAt: timestamp('takenAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const skinAnalyses = pgTable('skinAnalyses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  skinPhotoId: text('skinPhotoId').references(() => skinPhotos.id),
  userId: text('userId').references(() => users.id),
  score: integer('score'),
  inflammation: integer('inflammation'),
  redness: integer('redness'),
  visibleLesions: integer('visibleLesions'),
  comedones: integer('comedones'),
  dryness: integer('dryness'),
  oiliness: integer('oiliness'),
  acneScars: integer('acneScars'),
  notes: text('notes'),
  summary: text('summary'),
  confidence: real('confidence'),
  comparedToPrevious: text('comparedToPrevious'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const medications = pgTable('medications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').references(() => users.id),
  name: text('name').notNull(),
  dosage: text('dosage'),
  unit: text('unit'),
  timesOfDay: jsonb('timesOfDay'),
  frequency: text('frequency'),
  startDate: date('startDate').notNull(),
  endDate: date('endDate'),
  notes: text('notes'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const medicationLogs = pgTable('medicationLogs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  medicationId: text('medicationId').references(() => medications.id),
  userId: text('userId').references(() => users.id),
  date: date('date').notNull(),
  timeOfDay: text('timeOfDay').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.medicationId, t.date, t.timeOfDay),
}));

export const skincareProducts = pgTable('skincareProducts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').references(() => users.id),
  name: text('name').notNull(),
  instructions: text('instructions'),
  amount: text('amount'),
  timesOfDay: jsonb('timesOfDay'),
  frequency: text('frequency'),
  startDate: date('startDate').notNull(),
  endDate: date('endDate'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const skincareLogs = pgTable('skincareLogs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('productId').references(() => skincareProducts.id),
  userId: text('userId').references(() => users.id),
  date: date('date').notNull(),
  timeOfDay: text('timeOfDay').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.productId, t.date, t.timeOfDay),
}));

export const meals = pgTable('meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').references(() => users.id),
  type: text('type').notNull(),
  description: text('description'),
  imageUrl: text('imageUrl'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const foodAnalyses = pgTable('foodAnalyses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId: text('mealId').references(() => meals.id),
  ingredients: jsonb('ingredients'),
  estimatedProperties: jsonb('estimatedProperties'),
  confidence: real('confidence'),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const dailySummaries = pgTable('dailySummaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').references(() => users.id),
  date: date('date').notNull(),
  skinScore: integer('skinScore'),
  treatmentCompliance: real('treatmentCompliance'),
  mealCount: integer('mealCount').default(0),
  aiSummary: text('aiSummary'),
  observations: jsonb('observations'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.userId, t.date),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SkinPhoto = typeof skinPhotos.$inferSelect;
export type NewSkinPhoto = typeof skinPhotos.$inferInsert;
export type SkinAnalysis = typeof skinAnalyses.$inferSelect;
export type NewSkinAnalysis = typeof skinAnalyses.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type NewMedicationLog = typeof medicationLogs.$inferInsert;
export type SkincareProduct = typeof skincareProducts.$inferSelect;
export type NewSkincareProduct = typeof skincareProducts.$inferInsert;
export type SkincareLog = typeof skincareLogs.$inferSelect;
export type NewSkincareLog = typeof skincareLogs.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type FoodAnalysis = typeof foodAnalyses.$inferSelect;
export type NewFoodAnalysis = typeof foodAnalyses.$inferInsert;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type NewDailySummary = typeof dailySummaries.$inferInsert;
