# EduNexus Project Requirements

## Must-Have Features (Course Project / Rubric Coverage)

These are required to secure full marks for COMP229:

1. **User Management & Security**
   - Registration, login/logout, profile management
   - Secure access control (only owners can edit their own records)
   - Prevent non‑registered users from accessing secure areas

2. **CRUD Operations**
   - Courses: create, edit, view, delete/disable
   - Projects: create, edit, manage membership
   - Peer feedback/reviews: create, edit, delete (by owner)

3. **Responsive Frontend**
   - Semantic HTML, CSS, JS/React
   - Bootstrap/Material for responsiveness
   - Error‑free code, proper file organization

4. **Backend & Database**
   - Node/Express backend deployed to a cloud provider (Render or Heroku acceptable)
   - MongoDB Atlas (or Firebase) cloud database
   - Model classes in place, schema aligned with requirements

5. **Internal Documentation**
   - Section headers and inline comments for readability
   - Contextual variable names

6. **Agile Tracking**
   - Trello/Jira backlog snapshots at each milestone

7. **Final Release**
   - Functionally complete and visually appealing
   - Backend + frontend deployed and running error‑free
   - Cloud database connected

---

## Nice-to-Have Features (Future Production Site)

These are valuable for a real platform but not required for course grading:

- **Advanced Review Features**
  - Weighted averages by recency
  - Controlled tag vocabulary enforcement
  - Syllabus revision filtering
  - Minimum threshold logic (≥3 reviews)

- **Community Features**
  - Peer endorsements, mentor flags
  - Homepage stats cards (Registered Students, Courses with Reviews, Active Students, Projects Recruiting)

- **Scalability**
  - Multi‑institution support (compound uniqueness with `institution`)
  - Internationalization of GPA scales
  - Aliases for course titles

- **Moderation**
  - Review status (approved/flagged/deleted)
  - Admin vs moderator role separation

- **UI Enhancements**
  - Visual polish beyond “functional and responsive”
  - Dynamic charts/analytics dashboards