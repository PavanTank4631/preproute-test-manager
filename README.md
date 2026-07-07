# Preproute Test Manager

Test management app for creating MCQ tests, adding questions and publishing them. Built for the Preproute frontend task.

Live demo: _add your deploy URL here_

## Features

- Login with JWT auth
- Dashboard with all tests, search and status filter
- Create / edit test (subject, topics, sub-topics, marking scheme)
- Add MCQ questions with 4 options and correct answer
- Rich text editor on the question (bold, italic, underline, superscript, subscript, lists)
- Bulk import questions from a CSV file (with a downloadable template)
- Image support per question via image URL, with a live preview
- Preview the whole test and publish it

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Zustand for auth state
- Axios (with interceptors for token + 401 handling)
- React Hook Form + Zod for form validation
- PapaParse for CSV import

## Running locally

```bash
npm install
npm run dev
```

Dev server runs on http://localhost:5173.

Build:

```bash
npm run build
```

## Login

```
User ID:  vedant-admin
Password: vedant123
```

API base: `https://admin-moderator-backend-staging.up.railway.app/api`

## Folder layout

```
src/
  api/          axios client + endpoints
  components/   Layout, StatusBadge, MultiSelect, etc
  pages/        Login, Dashboard, TestForm, Questions, Preview
  routes/       ProtectedRoute
  store/        auth store
  types/        shared types
```

## CSV import format

The Upload CSV button accepts a file with these columns:

```
question,option1,option2,option3,option4,correct_option,explanation,difficulty,media_url
```

`correct_option` accepts `option1`-`option4`, `1`-`4`, or `A`-`D`. `difficulty` accepts `easy`/`medium`/`hard`. Use the "Download CSV template" button to get a ready-made sample.

## A few things worth noting

- The create test API rejects `null` status, so I send `"draft"` on create.
- The API only accepts `chapterwise`, `mock`, `pyq` for test type.
- Bulk create questions needs a `subject` field on every question object even though the test already has one.
- On edit the API returns subject/topics as names, so I map them back to ids by matching the fetched lists.
- Questions are kept in local state while adding (manual or CSV), then saved together with the bulk endpoint.
- The question rich text is stored as HTML and rendered on the questions list and preview.

## Deploy

Set up for Vercel (`vercel.json` handles SPA routing). Build with `npm run build` and deploy `dist/`, or connect the repo directly.
