# Wix Service Documentation

## Overview

The Wix service provides integration with Wix Data API to query the `MemberLookup` collection, which contains teacher and student information.

## Configuration

Add the following environment variables to your `local.settings.json` or environment:

```json
{
  "IsEncrypted": false,
  "Values": {
    "WIX_API_KEY": "your-wix-api-key",
    "WIX_SITE_ID": "5a9be9f4-02c1-4ec5-93f4-f03240e69bd4",
    "WIX_COLLECTION_ID": "MemberLookup"
  }
}
```

## API Endpoints

All endpoints require authentication (JWT token).

### 1. Get Teacher by Email

**GET** `/api/wix/teacher?email={email}`

Returns a teacher with `rolekey='teachers'` matching the given email.

**Example:**
```bash
curl -H "Authorization: Bearer {token}" \
  "https://your-api.com/api/wix/teacher?email=cheunglaiyee@heepwohcsw.edu.hk"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "be3b9299-1e73-47f9-a79d-8798002cebf3",
    "lastname_e": "",
    "firstname_e": "",
    "title": "cheunglaiyee@heepwohcsw.edu.hk",
    "school": "Heep Woh CSW",
    "class": "5A,5B,5C,5D,5E",
    "rolekey": "teachers",
    "userCredits": 60
  }
}
```

### 2. Get Teacher with Students

**GET** `/api/wix/teacher/students?email={email}`

Returns a teacher along with all students in their assigned classes at the same school.

**Example:**
```bash
curl -H "Authorization: Bearer {token}" \
  "https://your-api.com/api/wix/teacher/students?email=cheunglaiyee@heepwohcsw.edu.hk"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teacher": { /* teacher object */ },
    "studentsCount": 150,
    "students": [
      {
        "_id": "student-id",
        "lastname_e": "Chan",
        "firstname_e": "Peter",
        "title": "peter@student.com",
        "school": "Heep Woh CSW",
        "class": "5A",
        "rolekey": "students"
      }
    ]
  }
}
```

### 3. Get Students by School and Class

**GET** `/api/wix/students?school={school}&class={class}`

Returns all students matching the given school and class.

**Example:**
```bash
curl -H "Authorization: Bearer {token}" \
  "https://your-api.com/api/wix/students?school=Heep Woh CSW&class=5A"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "school": "Heep Woh CSW",
    "class": "5A",
    "count": 30,
    "students": [ /* array of student objects */ ]
  }
}
```

### 4. Query Members

**GET** `/api/wix/members?rolekey={rolekey}&school={school}&class={class}&email={email}`

Query members with custom filters. All query parameters are optional.

**Example:**
```bash
# Get all teachers
curl -H "Authorization: Bearer {token}" \
  "https://your-api.com/api/wix/members?rolekey=teachers"

# Get students from a specific school
curl -H "Authorization: Bearer {token}" \
  "https://your-api.com/api/wix/members?rolekey=students&school=Heep Woh CSW"
```

### 5. Get All Teachers

**GET** `/api/wix/teachers`

Returns all teachers.

### 6. Get All Students

**GET** `/api/wix/students/all`

Returns all students.

### 7. Get Collection Statistics

**GET** `/api/wix/stats`

Returns statistics about the MemberLookup collection.

**Response:**
```json
{
  "success": true,
  "data": {
    "collectionId": "MemberLookup",
    "totalCount": 1500
  }
}
```

## Service Usage

You can also use the Wix service directly in your code:

```typescript
import { wixService } from '../services/wixService';

// Find a teacher by email
const teacher = await wixService.findTeacherByEmail('teacher@example.com');

// Get teacher with their students
const result = await wixService.findTeacherWithStudents('teacher@example.com');
console.log(result.teacher);
console.log(result.students);

// Find students by school and class
const students = await wixService.findStudentsBySchoolAndClass('Heep Woh CSW', '5A');

// Query with custom filters
const members = await wixService.queryMembers({
  rolekey: 'students',
  school: 'Heep Woh CSW'
});

// Get all teachers or students
const allTeachers = await wixService.getAllTeachers();
const allStudents = await wixService.getAllStudents();
```

## Data Schema

### Member Object

```typescript
interface Member {
  _id: string;              // Unique ID
  _owner: string;           // Owner ID
  _createdDate: string;     // ISO timestamp
  _updatedDate: string;     // ISO timestamp
  lastname_e: string;       // Last name (English)
  lastname_c: string;       // Last name (Chinese)
  firstname_e: string;      // First name (English)
  firstname_c: string;      // First name (Chinese)
  title: string;            // Email address
  school: string;           // School name
  classno: any;             // Class number
  class: string;            // Class assignments (comma-separated)
  roleid: string;           // Role ID
  rolekey: string;          // Role key ('teachers' or 'students')
  memberId: string;         // Member ID
  userCredits: number;      // User credits
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing required parameters)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (teacher or data not found)
- `500` - Internal Server Error (API or service error)
