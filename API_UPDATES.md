## API Security & Features Update - Summary

### ✅ A) Error Handling Consistency (Security)

**Fixed:** All instances of `res.status(500).json({ error: err.message })` replaced with `res.status(500).json({ error: "Server error" })`

**Files Updated:**

- `opportunityRoutes.js` - 8 replacements
- `applicationRoutes.js` - 1 replacement
- `authRoutes.js` - 2 replacements
- `dashboardRoutes.js` - 3 replacements

**Impact:** No internal error messages leak to clients anymore, improving security posture.

---

### ✅ B) New API Features

#### 1. **DELETE Single Application**

```
DELETE /api/applications/:id
```

- Ownership check (can only delete own applications)
- Prevents deletion of final statuses (Selected/Rejected)
- Returns 404 if application not found

#### 2. **Enhanced PATCH - Edit All External Fields**

```
PATCH /api/applications/:id
```

Previously only supported: `{ status, notes }`

Now also supports (for external applications only):

- `externalTitle`: Edit title
- `externalCompany`: Edit company
- `externalType`: Edit type (Job, Internship, etc.)
- `externalLink`: Edit with URL validation
- `externalDeadline`: Edit deadline

#### 4. **Deadline Reminders System**

**New Features:**

- Scheduled background task checks for upcoming deadlines daily at 9 AM
- Identifies opportunities and applications due within 3 days
- Creates in-app notifications for relevant users
- Optional email notifications (configurable)
- Modular design - can be disabled in development

**New Models:**

- `Notification` - Stores in-app notifications with read status and email sent flag

**New Routes:**

```
GET /api/notifications - Get user's notifications
PATCH /api/notifications/:id/read - Mark notification as read
DELETE /api/notifications/:id - Delete notification
```

**Environment Variables:**

- `ENABLE_DEADLINE_REMINDERS=true` - Enable/disable the feature
- `ENABLE_EMAIL_NOTIFICATIONS=false` - Enable/disable email sending
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration

**Frontend Updates:**

- Notification bell icon in navbar with unread count
- Dropdown to view and manage notifications
- Real-time notification fetching

---

````

- `page`: 1 (default, 1-indexed)
- `limit`: 10 (default, max 100)
- Returns pagination metadata:
  ```json
  {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
````

#### 4. **Opportunities Search/Filter**

```
GET /api/opportunities?type=Internship&company=Google
```

- `type`: Filter by type (Internship, Job, Hackathon, Scholarship)
- `company`: Case-insensitive search by company name
- Supports combining with pagination

**Example:**

```
GET /api/opportunities?page=1&limit=10&type=Internship&company=Google
```

---

### Implementation Details

**opportunityRoutes.js - GET /**

- Added pagination logic (page, limit, skip)
- Added type filtering
- Added company search with regex (case-insensitive)
- Returns total count for pagination calculations
- Maintains existing role-based visibility

**applicationRoutes.js**

- Enhanced PATCH to update external fields with validation
- Added DELETE /:id endpoint
- All endpoints check ownership (userId match)

---

### Client Usage Examples

#### Fetch opportunities with pagination:

```javascript
API.get("/opportunities?page=1&limit=10");
```

#### Filter by type:

```javascript
API.get("/opportunities?page=1&limit=10&type=Internship");
```

#### Search by company:

```javascript
API.get("/opportunities?company=Google");
```

#### Edit external application details:

```javascript
API.patch("/applications/123", {
  status: "Interview",
  externalTitle: "Updated Title",
  externalCompany: "New Company",
  externalLink: "https://example.com",
});
```

#### Delete an application:

```javascript
API.delete("/applications/123");
```

---

### Testing Checklist

- [ ] Test pagination with page/limit parameters
- [ ] Test type filtering (verify role-based visibility still works)
- [ ] Test company search with special characters
- [ ] Test DELETE on own application (should succeed)
- [ ] Test DELETE on final status (should fail with 400)
- [ ] Test DELETE on other user's application (should fail with 404)
- [ ] Test PATCH external fields (title, company, link, deadline)
- [ ] Test PATCH with invalid URL (should fail with 400)
- [ ] Verify error responses don't leak internal messages

---

## ✅ 5) Opportunity Rating System

**Features:**
- Users can rate approved opportunities on a 5-star scale (1-5 stars)
- Optional comment/review with each rating
- Each user can have one rating per opportunity (editable/replaceable)
- Rating statistics visible to contributors (for their opportunities) and admins (for all opportunities)
- Real-time rating display on opportunity detail page

**New Model:**
- `Rating` - Stores user ratings with unique index on (opportunityId, userId)

**New API Routes:**

```
GET /api/ratings/opportunity/:opportunityId
  - Get rating statistics and all ratings for an opportunity
  - Returns: totalRatings, averageRating, ratingCounts, individual ratings

POST /api/ratings
  - Submit or update a rating
  - Requires auth
  - Body: { opportunityId, rating: 1-5, comment: "optional" }
  - Prevents duplicate: updates if user already rated

GET /api/ratings/:opportunityId/my-rating
  - Get current user's rating for an opportunity
  - Requires auth
  - Returns: { hasRated, rating }

DELETE /api/ratings/:ratingId
  - Delete a rating (ownership check)
  - Requires auth
```

**Dashboard Updates:**

- **Contributor Analytics**: Shows `Avg Rating` and `Total Ratings` per submitted opportunity
- **Admin Dashboard**: Shows `Avg Rating` and `Total Ratings` for top opportunities
- **User Dashboard**: Can rate opportunities from detail page

**Frontend Components:**

- `OpportunityRating.jsx`: 
  - 5-star rating selector with hover preview
  - Optional comment field
  - Displays rating statistics and breakdown
  - Shows recent reviews
  - Mark as read/delete functionality (own ratings)

**Usage Example:**

```javascript
// Submit a rating
API.post("/ratings", {
  opportunityId: "6123abc",
  rating: 4,
  comment: "Great opportunity, good pay!"
});

// Get ratings for an opportunity
API.get("/ratings/opportunity/6123abc");

// Get user's rating
API.get("/ratings/6123abc/my-rating");

// Delete a rating
API.delete("/ratings/ratingId");
```

**Example Response:**

```json
{
  "opportunityId": "6123abc",
  "totalRatings": 12,
  "averageRating": 4.2,
  "ratingCounts": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 5,
    "5": 4
  },
  "ratings": [
    {
      "id": "rating123",
      "userId": "user456",
      "userName": "John Doe",
      "rating": 5,
      "comment": "Excellent opportunity!",
      "createdAt": "2026-04-06T10:30:00Z"
    }
  ]
}
```

---
