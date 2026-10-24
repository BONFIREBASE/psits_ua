-- =====================================================================
-- PSITS-UA Local Development Seed SQL
-- Generated: 2026-10-10T15:01:28.810Z
-- Source: Live Supabase Production Sync
-- =====================================================================

-- ─── FACULTY_LEADERSHIP (2 rows) ───
INSERT INTO public.faculty_leadership (id, name, credentials, title, department_or_college, institution, image_url, updated_at)
VALUES ('adviser', 'Carl Spence Percy', 'MIT', 'BSIT Program Head / PSITS Adviser', 'College of Computing and Information Sciences', 'University of Antique — Main Campus', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/faculty/adviser-1791128127394-PERCY.png', '2026-10-04T15:35:28.15+00:00')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, credentials = EXCLUDED.credentials, title = EXCLUDED.title, department_or_college = EXCLUDED.department_or_college, institution = EXCLUDED.institution, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.faculty_leadership (id, name, credentials, title, department_or_college, institution, image_url, updated_at)
VALUES ('dean', 'Dr. John C. Amar', 'DM', 'Dean', 'College of Computing and Information Sciences', 'University of Antique — Main Campus', '/assets/dean.png', '2026-10-04T15:21:09.376009+00:00')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, credentials = EXCLUDED.credentials, title = EXCLUDED.title, department_or_college = EXCLUDED.department_or_college, institution = EXCLUDED.institution, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

-- ─── OFFICERS (29 rows) ───
INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('ebdbc4ba-20fc-4749-b515-488c2354a485', 'Li Joshua Ramos', 'Auditor', 'Operations & PR', 'BSIT · CCIS', NULL, 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1791538650919-8026.jpg', FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s04911@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('85f184b8-71a6-47ec-87c9-6093e6233efa', 'Bon Jury Pecaoco', 'Vice President', 'Executive', 'BSIT · CCIS', NULL, 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790687450485-Messenger_creation_576040F2-BEFF-48AD-8134-C42FEA769DCA.jpeg', FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2024s00002@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('3c6651b8-5765-4205-aaef-67bbfc722098', 'Charyl Naldo', 'Treasurer', 'Secretariat & Finance', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s01190@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('6fc1c6f0-44a4-4955-aebc-344dd244b1b8', 'Angel Nicole Albuera', 'Business Manager 2', 'Operations & PR', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s00496@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('d4e9c6e4-3589-4677-b982-b33e91afdcf1', 'Arvin Balquin', 'President', 'Executive', 'BSIT · CCIS', NULL, 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790027003096-PUBMATS__4_.jpg', FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', 'ajbalquin@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('510a3741-f11b-45a3-8c20-7ce5af19b530', 'Elijah Arevalo', 'Business Manager 1', 'Operations & PR', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s01185@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('921c8942-34e7-47cf-bcd5-b97351202715', 'Louise Jan Carlo Tabaldo', 'Public Information Officer (P.I.O.)', 'Operations & PR', 'BSIT · CCIS', NULL, 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/officers/1790038987209-786157234_1072917365326702_8204764968442477849_n.jpg', FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s00846@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('ab142ce1-742e-4c8c-90b1-fa974c8a2077', 'Ace Vergel Hiva', 'Assistant Auditor', 'Secretariat & Finance', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s00837@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('abe3f7b8-569e-47ca-bbec-014b1d6b13f5', 'Rona Mae Sangcap', '2nd Year Representative', 'Year Representatives', 'BSIT · 2nd Year', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s00493@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('eb624f2e-56e6-4cc9-aba5-2857fb7ba482', 'Gee. V. P. Parohinog', '4th Year Representative', 'Year Representatives', 'BSIT · 4th Year', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('d84007c2-9450-4ecd-8afa-db5177d7f845', 'Paulen Monique Operiano', 'Assistant Treasurer', 'Secretariat & Finance', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2025s01200@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('c9802b79-c7c1-40ed-bc36-4e746b7c33d9', 'Jin Sung Jung', 'Secretary', 'Secretariat & Finance', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', 'jejung@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('c1a1f2a5-2e77-44bf-8a2d-74bbd2a4c70d', 'Adrianne Blancia', '1st Year Representative', 'Year Representatives', 'BSIT · 1st Year', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('8af1ab0b-5e46-4c14-9c35-b115484985b7', 'Christine Sumande', 'Assistant Secretary', 'Secretariat & Finance', 'BSIT · CCIS', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', '2026s00978@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('02e0ca15-65ec-4161-8676-4f1a00ae3711', 'Selwyn Matalubos', '3rd Year Representative', 'Year Representatives', 'BSIT · 3rd Year', NULL, NULL, FALSE, NULL, '2026-09-18T05:31:12.952396+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('96ec9f84-0ebf-4dc9-837e-7d1200216171', 'Blessy Bielle P. Odango', 'Graphic Designer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Graphic Designer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('12bea97f-9f67-414b-99ab-727817dbcba5', 'Mark Gelo S. Wieldt', 'Graphic Designer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Graphic Designer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('af254e8d-586a-42ac-bdcf-15e88c5cb785', 'Rheinheart Masuay', 'Graphic Designer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Graphic Designer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('c319d3c4-0d2a-497f-9495-3750245749e4', 'Jairoh Noe Bachicha Bremon', 'Photographer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('27d82c3e-bc29-4ef0-a34c-9099dc9b8f33', 'Clarence Morales', 'Photographer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('588a9ee1-89ae-4cee-9115-c0be83239aaa', 'Precious Rhyza S. Ricasio', 'Photographer / Videographer / Editor', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer / Videographer / Editor', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('fcf6a676-5b83-456a-a91d-be778d24dbb5', 'Ellen June Cardinal', 'Photographer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('627efddb-a33a-4936-9fe8-1dbad18060f7', 'Elijah Arevalo', 'Lead Photographer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('062ece53-288b-499c-8f40-d48b84c0de66', 'Arvin Balquin', 'Graphic Designer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Graphic Designer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('fa24122a-583e-4e84-96fc-7dc5c07ff4dc', 'Ma. Echel Vicencio', 'Writer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Writer', '2026-09-18T11:32:05.050228+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('c311be16-7e01-4383-bd58-0f25372b5a59', 'Bon Jury Pecaoco', 'Lead Developer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Programmer', '2026-09-18T12:29:32.442046+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('ccfc266a-974a-41bf-8c9e-aa349a831403', 'Paulen Operiano', 'Writer', 'Operations & PR', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Writer', '2026-09-21T22:42:59.088363+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('d81fa970-d3f2-4f05-8324-507db6e7e50b', 'Li Joshua Ramos', 'Photographer', 'Executive', 'Pubmat Creative Team', NULL, NULL, TRUE, 'Photographer', '2026-09-29T14:44:58.674888+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

INSERT INTO public.officers (id, name, position, role_group, year_section, quote, image_url, is_pubmat, pubmat_role, created_at, email)
VALUES ('cc63f1e4-177e-4b06-963c-c24946e1ad16', 'Warren Jake Alera', 'IT Support', 'Executive', 'Pubmat Creative Team', NULL, NULL, TRUE, 'IT Support', '2026-09-30T00:42:55.186937+00:00', '2025s01173@antiquespride.edu.ph')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, role_group = EXCLUDED.role_group, year_section = EXCLUDED.year_section, quote = EXCLUDED.quote, image_url = EXCLUDED.image_url, is_pubmat = EXCLUDED.is_pubmat, pubmat_role = EXCLUDED.pubmat_role, created_at = EXCLUDED.created_at, email = EXCLUDED.email;

-- ─── POSTS (11 rows) ───
INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('cf055f64-06b7-44b4-b96a-e0db75e61816', 'suicide-prevention-month-you-are-not-a-burden', 'Suicide Prevention Month: You Are Not a Burden', 'Official Advisory', 'September 5, 2026', 'Before you scroll past this — read this one line first: You Are Not a Burden. September is Suicide Prevention Month, and if no one has told you today, let this be your reminder: You are not alone. Reach out, speak up, stay alive.', 'Before you scroll past this — read this one line first: You Are Not a Burden.

September is Suicide Prevention Month, and if no one has told you today, let this be your reminder:
• You are not alone. Reach out, speak up, stay alive.
• It''s okay to not be okay. It''s not okay to stay silent.
• Your story isn''t over yet.

"The Lord is near to the brokenhearted." — Psalm 34:18

Emergency Support & Crisis Hotlines:
• National Center for Mental Health (DOH): 1553 (Toll-Free) | (02) 989-8727 | 0917-899-8727 | 0908-639-2672
• Hopeline PH: (02) 8804-4673 | 0917-558-4673 | 0918-873-4673
• Municipal Health Office (San Jose): 036-641-0791 | mhosanjose06@gmail.com
• University of Antique Guidance Unit: guidance@antiquespride.edu.ph

You are not alone. You are loved. You are valued. And you matter.', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/suicide_prevention.jpg', 'The Lord is near to the brokenhearted. — Psalm 34:18', 'Psalm 34:18', 'https://www.facebook.com/share/p/1DGqiMHKhc/', '{"#SuicidePreventionMonth","#StartTheConversation","#MentalHealthAwareness","#PSITSUA"}'::text[], TRUE, '2026-09-18T04:56:37.435021+00:00', '2026-09-18T04:56:37.435021+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('377ac26a-7d01-4f73-9264-5a00eef528a0', 'ccis-orientation-and-welcoming-program-2026', 'CCIS Orientation & Welcoming Program 2026: Setting the Standard', 'Campus Event', 'September 2, 2026', 'The College of Computing and Information Sciences formally welcomed its newest batch of freshmen and transferees at the Paghi-usa Hall. Here''s a recap of the day''s milestones and executive messages.', 'The College of Computing and Information Sciences formally welcomed its newest batch of freshmen and transferees at the Paghi-usa Hall.

Key Takeaways & Highlights:
1. Department Vision & Strategic Goals 2026-2027 presented by the Dean.
2. Introduction of the College Faculty and Department Advisers.
3. Code of Conduct, Academic Honesty Policies, and Grading Criteria review.
4. Open Q&A Session with student organization leaders and seniors.

Welcome to CCIS! Welcome to PSITS-UA!', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/butlak.jpg', 'The beginning of every great developer starts with a single step into the unknown.', 'CCIS Dean', 'https://www.facebook.com/share/p/1B2Gumht2T/', '{"#CCISOrientation2026","#WelcomeFreshmen","#PSITSUA","#UACollegeOfComputing"}'::text[], FALSE, '2026-09-18T04:56:37.435021+00:00', '2026-09-18T04:56:37.435021+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('3becb279-3b9a-4741-8fc6-ddde0a1d227b', 'call-for-creatives-and-student-ambassadors', 'Call for Creatives & Tech Committee Officers: Join the Core Team', 'Recruitment', 'August 28, 2026', 'PSITS-UA is opening committee recruitment for creatives, technical directors, content writers, and logistics officers. Applications close September 15, 2026.', 'PSITS-UA is opening committee recruitment for the upcoming Academic Year 2026–2027.

Open Committees:
• Technical & Systems Development (Frontend, Backend, Cloud Infrastructure)
• Creatives & Media Production (Graphic Design, Video Editing, Pubmats)
• Editorial & Public Relations (News Writing, Social Media, Dispatches)
• Logistics & Event Operations (Event Coordination, Venue Prep, Secretariat)

Apply now through your departmental Google accounts.', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/publication_recruitment.jpg', 'Leadership is not about a title — it is about service, craft, and leaving things better than you found them.', 'PSITS-UA Executive Board', 'https://www.facebook.com/share/p/15QJv7Gj89/', '{"#PSITSRecruitment","#JoinTheCore","#TechLeaders","#UACommunity"}'::text[], FALSE, '2026-09-18T04:56:37.435021+00:00', '2026-09-18T04:56:37.435021+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('9b063601-4a6b-4b07-8249-361afb9afb36', 'bytecraft-hackathon-2026-announcement', '𝐂𝐚𝐩𝐭𝐮𝐫𝐞 𝐘𝐨𝐮𝐫 𝐁𝐞𝐬𝐭 𝐌𝐨𝐦𝐞𝐧𝐭𝐬 𝐚𝐭 𝐭𝐡𝐞 𝐏𝐒𝐈𝐓𝐒 𝐏𝐡𝐨𝐭𝐨𝐛𝐨𝐨𝐭𝐡', 'Official Advisory', 'August 20, 2026', 'Get your teams ready! The annual ByteCraft Hackathon 2026 officially launches. Theme: Smart Campus Innovation & Community Resilience Format: Hybrid (Onli...', 'Get your teams ready! The annual ByteCraft Hackathon 2026 officially launches.

Theme: Smart Campus Innovation & Community Resilience
Format: Hybrid (Online Preliminary Submission + On-Campus Finals at CCIS Lab)
Prizes: Cash awards, cloud vouchers, and certificates of distinction for top 3 teams.

Form your teams of 3 to 4 BSIT students and prepare for registration!', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/photobooth.jpg', 'Building solutions for our local community with modern cloud technologies.', 'Hackathon Lead', 'https://www.facebook.com/permalink.php?story_fbid=pfbid023BRxc7vssyuhvZMV2XGDYKT4uYdG84khW8isk2hX9j5yGVnoNV1WmKZ6H21RbmmVl&id=100086983023496', '{"#ByteCraft2026","#PSITSHackathon","#CampusInnovation","#CodeForChange"}'::text[], FALSE, '2026-09-18T04:56:37.435021+00:00', '2026-09-21T21:58:48.139+00:00', '{"writer":"Hackathon Lead"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('d309bddc-4e52-41b9-9890-2c48e92d6887', 'post-mu6p5db6', '𝐈𝐍 𝐏𝐇𝐎𝐓𝐎𝐒 | 𝐀𝐒𝐄𝐀𝐍 𝟐𝟎𝟐𝟔: 𝐄𝐜𝐡𝐨𝐞𝐬 𝐨𝐟 𝐭𝐡𝐞 𝐅𝐮𝐭𝐮𝐫𝐞', 'Campus Event', '2026-09-17', 'Where the voices of our past shape the innovations of tomorrow. One Vision, One Identity, One Community. ‎  ‎"University of Antique, a place where unity...', 'Where the voices of our past shape the innovations of tomorrow. One Vision, One Identity, One Community.
‎

> ‎"University of Antique, a place where unity is driven by their compassion in music and dancing."

‎
‎From Rasa Sayang to Ibong Kakanta-Kanta, each college brought a piece of Southeast Asia to the stage — Malaysia''s Rambai dance, Brunei''s Umang Tinting, Cambodia''s Robam Kuos Tralaok, Thailand''s Loi Krathong, Myanmar''s Foo Foo, Singapore''s Zapin Muara, Laos'' Lam Vong, Vietnam''s Vu Phien, and more.
‎
‎"Unity in Motion" Kasubay Dance Troupe — one stage, one region, one heartbeat.', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1789720117596-813977647_1061294106780014_4316023986118160508_n.jpg', NULL, NULL, 'https://www.facebook.com/share/p/1BPL8wYBMG/', '{}'::text[], FALSE, '2026-09-18T08:28:41.532609+00:00', '2026-09-18T08:28:41.532609+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('7ae4dd86-98a1-4908-8975-d98f4014ec47', 'pubmat-team-applications-are-now-officially-closed-mu6p6nrq', 'PUBMAT Team applications are now officially closed!', 'Official Advisory', '2026-09-17', 'Thank you to everyone who applied, we''re excited to welcome our new batch of creatives! Welcome to the team!. The PUBMAT Team is now complete! ‎ ‎Let''s cre...', 'Thank you to everyone who applied, we''re excited to welcome our new batch of creatives! Welcome to the team!. The PUBMAT Team is now complete!
‎
‎Let''s create, collaborate, and inspire together!', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1789720178027-813672749_1061194220123336_4822859530930275037_n.jpg', NULL, NULL, 'https://www.facebook.com/share/p/1GZQoSvPen/', '{"#PSITS #PSITSUA #UniversityofAntique #pubmat #elipogi #CCIS"}'::text[], FALSE, '2026-09-18T08:29:41.679428+00:00', '2026-09-18T08:29:41.679428+00:00', NULL)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('3fd1ae62-198b-4d07-baec-ec1e1f3e8b9f', 'post-mubtz4ju', '𝐈𝐍 𝐏𝐇𝐎𝐓𝐎𝐒 | 𝙋𝙖𝙜𝙝𝙞𝙣𝙪𝙣𝙖𝙣𝙪𝙣: 𝙍𝙚𝙖𝙙𝙮, 𝙎𝙚𝙩, 𝙑𝙤𝙩𝙚!', 'Campus Event', '2026-09-21', 'The University of Antique conducted a voter''s education seminar, with the theme "𝙋𝙖𝙜𝙝𝙞𝙣𝙪𝙣𝙖𝙣𝙪𝙣: 𝙍𝙚𝙖𝙙𝙮, 𝙎𝙚𝙩, 𝙑𝙤𝙩𝙚! ". This seminar was...', 'The University of Antique conducted a voter''s education seminar, with the theme "𝙋𝙖𝙜𝙝𝙞𝙣𝙪𝙣𝙖𝙣𝙪𝙣: 𝙍𝙚𝙖𝙙𝙮, 𝙎𝙚𝙩, 𝙑𝙤𝙩𝙚! ". This seminar was conducted at Tiripunan Hall on September 21, in line with the celebration of  the 125th Philippine Civil Service Anniversary. 
Citizens shape their country and their future. 

Voters’ education helps individuals understand the importance of their vote, learn about the election process, recognize their rights and responsibilities, and make informed decisions based on reliable information. This seminar promoted awareness, critical thinking, and responsible participation in the democratic process.
Be informed. Make good decisions. Build a better community. Let’s vote wisely.', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1790030554840-cover.jpg', NULL, NULL, 'https://www.facebook.com/share/p/14iWPCFtHN1/', '{"#psitua #UniversityofAntique #CCIS #pubmat"}'::text[], FALSE, '2026-09-21T22:42:36.637586+00:00', '2026-09-21T23:02:13.506+00:00', '{"pubmat":"Blessy Bielle P. Odango","writer":"Paulen Operiano","photographer":"Ellen June Cardinal"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('7e02bd7f-fbf8-4661-bc13-4d12fe7166dd', 'survivors-toolkit-2026-mucpuuo3', 'Survivors Toolkit 2026', 'Event Recap', '2026-09-22', '𝐈𝐍 𝐏𝐇𝐎𝐓𝐎𝐒 | Survivors TOOLKITS 2026. Guidance Counseling Services Unit.  ‎ ‎We have a different stories to share. As will as the speakers spoke....', '𝐈𝐍 𝐏𝐇𝐎𝐓𝐎𝐒 | Survivors TOOLKITS 2026. Guidance Counseling Services Unit. 

‎
‎We have a different stories to share. As will as the speakers spoke. "It''s okay to stop and rest. But don''t give up. " >Don''t give up.<, Paulit-ulit nila itong binabangit.
‎
𝖣𝗈 𝗂𝗍 𝗌𝖼𝖺𝗋𝖾𝖽. As the  First Speaker, said. 
‎
‎It''s okay to stop and rest. But don''t give up!. 
‎He also challenge the students to take the civil service examination. He not stated the reason why, but It will help them—us  in the future. 
‎
‎Isaiah- 60:22
‎"When the time is right I, the Lord will make it happen." 
‎
‎Mrs. Marilu B. Baculna  , said. The wa-is person is more advance. (Preparations is the key) 
‎It''s not being a genius but it''s preparations. 
‎

‎-Have boundaries 
‎-Focus on yourself
‎- Be Strong 
‎-Stay Strong
‎-Stay Positive 
‎
‎
‎•We will graduate, we have the qualities to graduate. 
‎
✍: Ma Echel Vicenio
📷: Li Joshua Ramos & Jairoh Bremon
🎨: Blessy Bielle Odango
‎#PSITS #CCIS #Pubmat', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1790084103050-FB_IMG_1790083834789.jpg', 'START STRONG, STAY STRONG', NULL, 'https://www.facebook.com/share/p/1EwNgEfrq2/', '{"#PSITS","#CCIS","#Pubmat"}'::text[], FALSE, '2026-09-22T13:35:04.902184+00:00', '2026-09-22T13:35:04.902184+00:00', '{"pubmat":"Blessy Bielle P. Odango","writer":"Ma. Echel Vicencio","photographer":"Jairoh Noe Bachicha Bremon"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('f55ca93d-bd34-4ea2-8a80-9ec7fbc13592', 'post-mukosvta', '𝗣𝗦𝗜𝗧𝗦–𝗨𝗔 𝗣𝗼𝗹𝗼 𝗦𝗵𝗶𝗿𝘁 𝗗𝗲𝘀𝗶𝗴𝗻 𝗖𝗼𝗻𝘁𝗲𝘀𝘁', 'Official Advisory', '2026-09-28', 'The 𝗣𝗦𝗜𝗧𝗦–𝗨𝗔 𝗣𝗼𝗹𝗼 𝗦𝗵𝗶𝗿𝘁 𝗗𝗲𝘀𝗶𝗴𝗻 𝗖𝗼𝗻𝘁𝗲𝘀𝘁 is now 𝒂𝒄𝒄𝒆𝒑𝒕𝒊𝒏𝒈 𝒆𝒏𝒕𝒓𝒊𝒆𝒔! Students are invited to imagine, create, and in...', 'The 𝗣𝗦𝗜𝗧𝗦–𝗨𝗔 𝗣𝗼𝗹𝗼 𝗦𝗵𝗶𝗿𝘁 𝗗𝗲𝘀𝗶𝗴𝗻 𝗖𝗼𝗻𝘁𝗲𝘀𝘁 is now 𝒂𝒄𝒄𝒆𝒑𝒕𝒊𝒏𝒈 𝒆𝒏𝒕𝒓𝒊𝒆𝒔! Students are invited to imagine, create, and inspire by submitting their original polo shirt designs through the official submission portal. The submissions will open at 𝟭𝟮 𝗣𝗠 today!

Submission: September 28, 2026
Deadline: October 5, 2026

Submission Link: [https://psitsua.vercel.app/submission ](url)
PubMat: Blessy Bielle Odango', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1790566061239-825281924_1070262459216512_2053477150321626612_n.jpg', NULL, NULL, 'https://www.facebook.com/share/p/1DH2HZy5jr/', '{"#pubmat","#PSITS","#ccis"}'::text[], FALSE, '2026-09-28T03:27:42.725637+00:00', '2026-09-28T03:27:42.725637+00:00', '{"pubmat":"Blessy Bielle P. Odango"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('3fdb8bac-e634-45be-914c-b043b06c3f60', 'post-muuvn3qe', '𝐈𝐍 𝐏𝐇𝐎𝐓𝐎𝐒 | 𝐖𝐎𝐑𝐋𝐃 𝐓𝐄𝐀𝐂𝐇𝐄𝐑𝐒’ 𝐃𝐀𝐘 𝟐𝟎𝟐𝟔', 'Campus Event', '2026-10-05', 'The 𝗨𝗻𝗶𝘃𝗲𝗿𝘀𝗶𝘁𝘆 𝗼𝗳 𝗔𝗻𝘁𝗶𝗾𝘂𝗲 – 𝗠𝗮𝗶𝗻 𝗖𝗮𝗺𝗽𝘂𝘀 celebrated World Teachers’ Day 2026 on October 5, honoring teachers for their contributi...', 'The 𝗨𝗻𝗶𝘃𝗲𝗿𝘀𝗶𝘁𝘆 𝗼𝗳 𝗔𝗻𝘁𝗶𝗾𝘂𝗲 – 𝗠𝗮𝗶𝗻 𝗖𝗮𝗺𝗽𝘂𝘀 celebrated World Teachers’ Day 2026 on October 5, honoring teachers for their contributions to student development and education.

The celebration featured messages from the 𝗗𝗲𝗽𝗮𝗿𝘁𝗺𝗲𝗻𝘁 𝗚𝗼𝘃𝗲𝗿𝗻𝗼𝗿𝘀, who were each assigned a letter and tasked to deliver a message representing its significance to the teaching community.

The 𝗨𝗔 𝗙𝗶𝗹𝗺 𝗦𝗼𝗰𝗶𝗲𝘁𝘆 also presented a performance depicting relatable experiences between teachers and students, highlighting the relationship and shared experiences within the academic community.
The program concluded with a 𝙘𝙤𝙢𝙢𝙪𝙣𝙞𝙩𝙮 𝙙𝙖𝙣𝙘𝙚 joined by teachers and faculty members, marking the celebration with a collective expression of appreciation and camaraderie.

The event emphasized the important role of teachers in guiding students, shaping their aspirations, and contributing to their growth both inside and outside the classroom.

As the university community celebrates World Teachers’ Day, students and faculty recognize the dedication and efforts of teachers who continue to serve as educators and mentors.

𝐇𝐚𝐩𝐩𝐲 𝐖𝐨𝐫𝐥𝐝 𝐓𝐞𝐚𝐜𝐡𝐞𝐫𝐬’ 𝐃𝐚𝐲 𝟐𝟎𝟐𝟔!', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1791182210539-happi_tc_day_____20261005_124441_0000.png', '‎You are not just a teacher by name, ‎You are a guiding light that helps us find our way. ‎ ‎Through every lesson, challenge, and year, ‎Your wisdom and kindness will always stay near. ‎ ‎You shape our dreams, you help us grow, ‎And teach us more than we may know. ‎For every journey, every mile, ‎Your lessons remain with us all the while.', 'Ma. Echel Vicencio', 'https://www.facebook.com/share/p/1ERZWJWW2x/', '{"#WorldTeachersDay2026","#UniversityofAntique","#psitsua","#pubmat"}'::text[], FALSE, '2026-10-05T06:36:51.786052+00:00', '2026-10-05T15:59:10.808+00:00', '{"pubmat":"Blessy Bielle P. Odango","writer":"Ma. Echel Vicencio","photographer":"Ellen June Cardinal"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

INSERT INTO public.posts (id, slug, title, category, date, excerpt, full_content, image_url, highlight_quote, quote_author, post_url, tags, featured, created_at, updated_at, credits)
VALUES ('3ccf626c-edd0-489d-8c89-56633269a69e', 'post-muvfo5lf', '𝗜𝗡 𝗣𝗛𝗢𝗧𝗢𝗦 | 𝗛𝗔𝗣𝗣𝗬 𝗧𝗘𝗔𝗖𝗛𝗘𝗥𝗦 𝗗𝗔𝗬!!!', 'Campus Event', '2026-10-05', 'To honor and celebrate the invaluable contributions of our educators, the University of Antique – Main Campus held a Teachers’ Day event on October 5, 2026....', 'To honor and celebrate the invaluable contributions of our educators, the University of Antique – Main Campus held a Teachers’ Day event on October 5, 2026.

At the College of Computing and Information Sciences (CCIS) lobby, students were given the opportunity to express their appreciation through gifts and heartfelt messages to their instructors. 

𝑻𝒉𝒆 𝒆𝒗𝒆𝒏𝒕 𝒔𝒆𝒓𝒗𝒆𝒅 𝒂𝒔 𝒂 𝒓𝒆𝒎𝒊𝒏𝒅𝒆𝒓 𝒕𝒉𝒂𝒕 𝒆𝒅𝒖𝒄𝒂𝒕𝒐𝒓𝒔 𝒑𝒍𝒂𝒚 𝒂𝒏 𝒊𝒎𝒑𝒐𝒓𝒕𝒂𝒏𝒕 𝒓𝒐𝒍𝒆 𝒊𝒏 𝒉𝒆𝒍𝒑𝒊𝒏𝒈 𝒖𝒔 𝒃𝒆𝒄𝒐𝒎𝒆 𝒃𝒆𝒕𝒕𝒆𝒓 𝒊𝒏𝒅𝒊𝒗𝒊𝒅𝒖𝒂𝒍𝒔.

Here’s to the teachers who inspire us to learn and grow.

Happy Teachers’ Day to all our amazing educators!', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/blog/1791215904458-Split_1_20261005_231642_0000.png', NULL, NULL, 'https://www.facebook.com/share/p/18e7aUSCQz/', '{"#psitua","#University of Antique","#CCIS","#pubmat"}'::text[], FALSE, '2026-10-05T15:57:33.58331+00:00', '2026-10-05T15:58:25.346+00:00', '{"pubmat":"Rheinheart Masuay","writer":"Paulen Monique Operiano","photographer":"Ellen June Cardinal"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt, full_content = EXCLUDED.full_content, image_url = EXCLUDED.image_url, highlight_quote = EXCLUDED.highlight_quote, quote_author = EXCLUDED.quote_author, post_url = EXCLUDED.post_url, tags = EXCLUDED.tags, featured = EXCLUDED.featured, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, credits = EXCLUDED.credits;

-- ─── EVENTS (15 rows) ───
INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('0dabc7be-a01b-4e54-bb68-bbf155ebdb05', 'Presentation and Ratification of the Proposed Constitution and By Laws', 'August 2026', 'TBA', 'CCIS AVR', 'Governance', 'To develop the skills of the students who are taking the course in Information Technology under the College of Computer Studies. · Involved: CCIS IT Students', 'Completed', '2026-09-18T13:04:45.08682+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('40ba747e-cba4-45b9-8f24-e7ab4a7902c0', 'Regular meeting and plan for the Acquaintance Party', 'September 2026', 'TBA', 'CCIS Students Council Office', 'Governance', 'To plan and organize activities for fostering camaraderie among students. · Involved: PSITS Officers and Advisers', 'Upcoming', '2026-09-18T13:04:45.239019+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('2bfc6958-7abe-4a36-9741-b33a56777e0a', 'PSITS-UA Uniform making contest', 'September 2026', 'TBA', 'CCIS AVR', 'Competition', 'To promote unity and creativity among IT students. · Involved: CCIS IT Students', 'Upcoming', '2026-09-18T13:04:45.374296+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('ff241336-cb9f-4e14-81e9-1c95e098c6fd', 'Hackathon', 'October 2026', 'TBA', 'CCIS AVR', 'Competition', 'To showcase and enhance the skills of the students that could lead into the better development of their technical skills. · Involved: CCIS IT Students', 'Upcoming', '2026-09-18T13:04:45.495538+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('6ab08e6a-45b9-44e9-8f66-317ece0539d8', 'CCIS acquaintance party', 'November 2026', 'TBA', 'paghiUsA Hall', 'Social', 'To welcome the freshies, and make camaraderie among other years in IT course. · Involved: All CCIS Students', 'Upcoming', '2026-09-18T13:04:45.675785+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('1a3843c5-76ed-4b3c-8f34-c0e6058624fc', 'IT Conference/Tech Expo Participation', 'November 2026', 'TBA', 'CCIS Lobby', 'Academic', 'To explore new technologies and trends in the field of IT. · Involved: All IT Students of CCIS', 'Upcoming', '2026-09-18T13:04:45.864245+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('5d196f3e-c47d-4dc3-a1bd-3f94f5959fe3', 'Career Guidance', 'December 2026', 'TBA', 'UA Covered Gym', 'Career', 'To prepare graduating students for future career paths. · Involved: All IT Students of CCS', 'Upcoming', '2026-09-18T13:04:45.984759+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('8ba713a6-5403-427c-8a45-18cde17c67d2', 'End Year Party', 'December 2026', 'TBA', 'UA Covered Gym', 'Social', 'To celebrate achievements and conclude the first semester with fellowship. · Involved: All IT Students of CCS', 'Upcoming', '2026-09-18T13:04:46.099545+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('4ebe7454-4d98-45d0-aa68-62759f960195', 'IT Bootcamp (Advanced Programming/Database)', 'January 2027', 'TBA', 'CCIS Lobby', 'Academic', 'To equip participants with advanced programming and database management skills through hands-on training, real-world problem solving, and exposure to industry best practices, enabling them to tackle complex technical challenges and drive innovation in their respective fields. · Involved: 1st and 2nd year IT students of CCS', 'Upcoming', '2026-09-18T13:04:46.234256+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('794ba871-4994-43f8-8821-713f508ce7b1', 'Internship Placements/Job Fair', 'February 2027', 'TBA', 'CCIS Lobby', 'Career', 'To provide opportunities for students to connect with potential employers. · Involved: 3rd year and 4th year', 'Upcoming', '2026-09-18T13:04:46.357259+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('a0525c99-ab2f-47fb-b6dd-9b7677ded369', 'Capstone Project Demo Day', 'March 2027', 'TBA', 'CCIS Lobby', 'Academic', 'To showcase student projects and innovative solutions. · Involved: All IT Students of CCS', 'Upcoming', '2026-09-18T13:04:46.470959+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('8e8fe3ff-7fa2-476a-9ad7-3838755f7cde', 'Summer Coding Bootcamp', 'April 2027', 'TBA', 'CCIS Lobby', 'Academic', 'To improve coding skills during summer break. · Involved: 1st and 2nd year IT students of CCS', 'Upcoming', '2026-09-18T13:04:46.631408+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('c7ef278d-ecd1-4c41-bc5b-3907fbbc5a3b', 'CCIS WEEK', 'May 2027', 'TBA', 'CCIS Lobby & CCIS AVR', 'Social', 'To highlight student talents and achievements in CCIS. · Involved: All CCIS Students', 'Upcoming', '2026-09-18T13:04:46.789435+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('203c79c4-f2b7-4b19-9672-1be07d08dabc', 'Regular Meeting (June)', 'June 2027', 'TBA', 'CCIS Student Council Office', 'Governance', 'To ensure continuous planning and coordination of organizational activities. · Involved: PSITS Officers and Advisers', 'Upcoming', '2026-09-18T13:04:46.901727+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.events (id, title, date, time, location, category, description, status, created_at)
VALUES ('be133160-4c40-4e82-9e99-57328f1bc66b', 'Regular Meeting (July)', 'July 2027', 'TBA', 'CCIS Student Council Office', 'Governance', 'To finalize year-end reports and transition to new leadership. · Involved: PSITS Officers and Advisers', 'Upcoming', '2026-09-18T13:04:47.014049+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

-- ─── PROJECTS (2 rows) ───
INSERT INTO public.projects (id, title, category, description, tags, image_url, demo_url, github_url, status, created_at)
VALUES ('1e669651-61e5-4eee-8f34-f8a23f2f64ac', 'Sugalaw PSITS Photobooth', 'Campus Utility', 'Official interactive digital photobooth and keepsake station engineered for campus-wide university celebrations, orientation programs, and departmental festivals.', '{"Campus Utility","Event System","Photography","PSITS-UA","By: PSITS-UA Pubmat & Tech Team"}'::text[], 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/projects/sugalaw.jpg', 'https://www.facebook.com/permalink.php?story_fbid=pfbid022pzu1p5hxva4affPjag7srv5pGweRnA1JJJscknxyqKb6aobMLWgeDTnrDH7sFHAl&id=100086983023496', NULL, 'Active', '2026-09-18T06:31:39.39557+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, description = EXCLUDED.description, tags = EXCLUDED.tags, image_url = EXCLUDED.image_url, demo_url = EXCLUDED.demo_url, github_url = EXCLUDED.github_url, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

INSERT INTO public.projects (id, title, category, description, tags, image_url, demo_url, github_url, status, created_at)
VALUES ('90a79869-5f31-4c1b-80cf-66df1ab85fa4', 'Student Management System', 'Capstone', 'A full-stack Student Management System application with Django REST Framework backend and modern React frontend.', '{"Django REST Framework backend and modern React frontend.","By: Juswa Potato Corner Dev"}'::text[], NULL, NULL, 'https://github.com/LeebatNgaLeepong/sms.git', 'Active', '2026-10-07T11:03:41.468673+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, description = EXCLUDED.description, tags = EXCLUDED.tags, image_url = EXCLUDED.image_url, demo_url = EXCLUDED.demo_url, github_url = EXCLUDED.github_url, status = EXCLUDED.status, created_at = EXCLUDED.created_at;

-- ─── BANNERS (3 rows) ───
INSERT INTO public.banners (id, title, subtitle, type, image_url, link_url, link_text, secondary_link_url, secondary_link_text, is_active, display_order, created_at, updated_at)
VALUES ('bab54a19-96cf-449f-b048-44b14363199b', 'Polo Shirt Design Submission', 'BSINFO students can now submit the T-shirt designs they created for everyone to see and vote for their favorite design.

[by:Jared Patrick Evangelio]', 'forms', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/banners/1789737410229-813020247_935522132962937_5390461590143080712_n.png', 'https://psitsua.vercel.app/submission', 'Submit Design', 'https://psitsua.vercel.app/view', 'View Submitted Design', TRUE, 0, '2026-09-18T11:39:40.578082+00:00', '2026-09-18T15:09:05.906+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, type = EXCLUDED.type, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, link_text = EXCLUDED.link_text, secondary_link_url = EXCLUDED.secondary_link_url, secondary_link_text = EXCLUDED.secondary_link_text, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

INSERT INTO public.banners (id, title, subtitle, type, image_url, link_url, link_text, secondary_link_url, secondary_link_text, is_active, display_order, created_at, updated_at)
VALUES ('d8995389-6215-463a-82c3-15c4d99df4e6', 'PSITS Reviews & Concern', '[by:Bon Jury Pecaoco]', 'forms', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/banners/1791527908933-Orange_Yellow_Modern_Customer_Feedback_Survey_Forms_Google_Forms.png', 'https://forms.gle/13U4eGHU8KauBYjn8', 'Submit a Review/Concern', NULL, NULL, TRUE, 0, '2026-10-09T06:38:31.158376+00:00', '2026-10-09T06:38:37.576+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, type = EXCLUDED.type, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, link_text = EXCLUDED.link_text, secondary_link_url = EXCLUDED.secondary_link_url, secondary_link_text = EXCLUDED.secondary_link_text, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

INSERT INTO public.banners (id, title, subtitle, type, image_url, link_url, link_text, secondary_link_url, secondary_link_text, is_active, display_order, created_at, updated_at)
VALUES ('b6b62dc2-5d1a-47ea-a7be-302b6b991b37', 'List of PSITS Member Student', 'Official Semestral Membership Assessment: A statutory fee of ₱25.00 per student is assessed on a per-semester basis to all duly registered BSIT students. [by:Bon Jury Pecaoco]', 'general', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/banners/1789910506379-55956652112.jpg', 'https://psitsua.vercel.app/dues', 'View', NULL, NULL, TRUE, 0, '2026-09-18T11:49:08.091053+00:00', '2026-09-28T03:14:34.489+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, type = EXCLUDED.type, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, link_text = EXCLUDED.link_text, secondary_link_url = EXCLUDED.secondary_link_url, secondary_link_text = EXCLUDED.secondary_link_text, is_active = EXCLUDED.is_active, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

-- ─── ARCHIVE_PHOTOS (11 rows) ───
INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-01', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-01.jpg', 'PSITS-UA Batch Archive Photo 01', NULL, NULL, 1, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-02', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-02.jpg', 'PSITS-UA Batch Archive Photo 02', NULL, NULL, 2, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-03', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-03.jpg', 'PSITS-UA Batch Archive Photo 03', NULL, NULL, 3, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-04', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-04.jpg', 'PSITS-UA Batch Archive Photo 04', NULL, NULL, 4, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-05', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-05.jpg', 'PSITS-UA Batch Archive Photo 05', NULL, NULL, 5, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-06', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-06.jpg', 'PSITS-UA Batch Archive Photo 06', NULL, NULL, 6, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-07', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-07.jpg', 'PSITS-UA Batch Archive Photo 07', NULL, NULL, 7, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-08', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-08.jpg', 'PSITS-UA Batch Archive Photo 08', NULL, NULL, 8, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-09', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-09.jpg', 'PSITS-UA Batch Archive Photo 09', NULL, NULL, 9, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-10', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-10.jpg', 'PSITS-UA Batch Archive Photo 10', NULL, NULL, 10, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

INSERT INTO public.archive_photos (id, url, alt, caption, year, display_order, created_at, updated_at, status)
VALUES ('psits-archive-11', 'https://pub-1813fa24f4b74f44896e886714f409db.r2.dev/archive/psits-archive-11.jpg', 'PSITS-UA Batch Archive Photo 11', NULL, NULL, 11, '2026-09-28T02:00:46.567178+00:00', '2026-09-28T02:00:46.567178+00:00', 'active')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt = EXCLUDED.alt, caption = EXCLUDED.caption, year = EXCLUDED.year, display_order = EXCLUDED.display_order, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status;

