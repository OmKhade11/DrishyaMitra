export const people = [
  {
    id: 1,
    name: "Sarah Johnson",
    photoCount: 12,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=max&w=400",
  },
  {
    id: 2,
    name: "Michael Brown",
    photoCount: 8,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=max&w=400",
  },
  {
    id: 3,
    name: "Emma Wilson",
    photoCount: 5,
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=max&w=400",
  },
];

export const photos = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080",
    title: "Beach Vacation",
    date: "2024-12-15",
    location: "Goa, India",
    faces: [
      {
        personId: 1,
        personName: "Sarah Johnson",
        x: 120,
        y: 80,
        width: 90,
        height: 90,
      },
      {
        personId: 2,
        personName: "Michael Brown",
        x: 300,
        y: 100,
        width: 85,
        height: 85,
      },
    ],
    tags: ["beach", "vacation", "family"],
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080",
    title: "Mountain Landscape",
    date: "2024-11-05",
    location: "Himachal Pradesh",
    faces: [],
    tags: ["nature", "mountain", "landscape"],
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1080",
    title: "Modern City",
    date: "2024-10-21",
    location: "Mumbai",
    faces: [],
    tags: ["city", "architecture"],
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080",
    title: "Food Photography",
    date: "2024-09-10",
    location: "Restaurant",
    faces: [
      {
        personId: 3,
        personName: "Emma Wilson",
        x: 200,
        y: 120,
        width: 80,
        height: 80,
      },
    ],
    tags: ["food", "meal"],
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080",
    title: "Sunset Ocean",
    date: "2024-08-02",
    location: "Maldives",
    faces: [],
    tags: ["sunset", "ocean"],
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1080",
    title: "Portrait Photo",
    date: "2024-07-15",
    location: "Studio",
    faces: [
      {
        personId: 1,
        personName: "Sarah Johnson",
        x: 140,
        y: 90,
        width: 100,
        height: 100,
      },
    ],
    tags: ["portrait"],
  },
];

export const aiResponses = [
  "I've found 3 photos from your beach vacation in December. Would you like me to create an album?",
  "I can help organize your photos! What would you like to do?",
  "Based on face recognition, I've identified Sarah in 47 photos. Would you like to tag more photos?",
  "I notice you have several landscape photos. Would you like me to group them together?",
  "I can help you search, organize, create albums, or identify people in your photos. What do you need?",
];