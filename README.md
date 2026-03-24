# LUMINA Portfolio — Folder Guide

## How to add your photos

1. Place your photos into the correct album folder:
   - `assets/photos/landscapes/`  → landscape shots
   - `assets/photos/portraits/`   → portrait shots
   - `assets/photos/urban/`       → urban / city shots
   - `assets/photos/abstract/`    → abstract / texture shots
   - `assets/photos/nature/`      → nature shots

2. Open `data.json` and add an entry to the `"photos"` array:
   ```json
   {
     "id": "p011",
     "file": "assets/photos/landscapes/my-photo.jpg",
     "title": "My Photo Title",
     "album": "landscapes",
     "year": 2025,
     "camera": "Sony A7IV",
     "location": "Iceland",
     "desc": "A short description of the photo.",
     "inSlider": false,
     "crop": null
   }
   ```

3. Open `index.html` in your browser — your photo appears automatically.

## How to use the Admin Panel

- Open `index.html` in a browser
- Type `adm` anywhere on the page (outside any input field) to open the login prompt
- Default login: **admin** / **lumina2025**

## Folder Structure

```
lumina/
├── index.html          ← Main portfolio page (open this)
├── admin.html          ← Admin panel (opens automatically after login)
├── data.json           ← All site settings and photo registry
├── README.md           ← This file
│
├── assets/
│   └── photos/
│       ├── landscapes/ ← Drop landscape photos here
│       ├── portraits/  ← Drop portrait photos here
│       ├── urban/      ← Drop urban photos here
│       ├── abstract/   ← Drop abstract photos here
│       └── nature/     ← Drop nature photos here
│
├── css/
│   └── style.css       ← All site styles
│
└── js/
    ├── site.js         ← Public site logic
    └── admin.js        ← Admin panel logic
```

## Adding a new album

In `data.json`, add to the `"albums"` array:
```json
{
  "id": "myalbum",
  "name": "My Album",
  "desc": "Description here",
  "folder": "assets/photos/myalbum",
  "accent": "#c9a84c",
  "gradient": "noir",
  "bg": "#0a0a0a",
  "textMode": "light"
}
```
Then create the folder `assets/photos/myalbum/` and drop photos in.

## Saving admin changes permanently

After making changes in the admin panel, click **"Save & Export data.json"**
to download the updated config file, then replace your local `data.json` with it.

## Serving locally

Because this site loads `data.json` via fetch, you need a local server:

**Quick option (Python):**
```
cd lumina
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Or use VS Code Live Server extension.**
