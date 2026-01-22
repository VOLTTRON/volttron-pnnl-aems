# AEMS Template System

This directory contains deployment-specific templates for welcome and info pages. The template system allows you to customize these pages for different AEMS deployments without requiring a rebuild of the application.

## Overview

The template system provides HTML fragments that are injected directly into the AEMS application:
- **Template files** (`welcome.html`, `info.html`) - Pure HTML fragments that inherit CSS from the main application
- **Dev preview tool** (`/dev/templates` page) - Integrated SPA page for testing templates across deployments

## Directory Structure

```
/static/templates/
├── default/                     # Fallback templates
│   ├── images/                  # Images for default templates
│   │   ├── fig1.jpg
│   │   └── ... (fig2-fig15.jpg)
│   ├── welcome.html             # Welcome page content
│   └── info.html                # Info page content
└── {campus}-{building}/         # Deployment-specific templates (lowercase)
    ├── images/                  # Deployment-specific images (optional)
    ├── welcome.html             # Welcome page content
    └── info.html                # Info page content (optional - falls back to default)
```

**Important Notes:**
- Deployment folder names must be lowercase (e.g., `pnnl-rob`, not `PNNL-ROB`)
- The system automatically converts environment variables to lowercase for matching
- Images should be stored in the template's `images/` subdirectory
- Each deployment can have its own images, or omit the images folder to use default images

## How It Works

### Template Selection

The system automatically selects the appropriate template based on environment variables:

1. **First Priority**: Deployment-specific template at `/static/templates/{CAMPUS}-{BUILDING}/{filename}`
2. **Second Priority**: Default template at `/static/templates/default/{filename}`
3. **Third Priority**: Legacy fallback at `/static/{filename}`

### Environment Variables

The template selection is driven by two environment variables defined in `aems-app/.env`:

- `VOLTTRON_CAMPUS` - Campus identifier (e.g., "PNNL")
- `VOLTTRON_BUILDING` - Building identifier (e.g., "ROB")

These are automatically exposed to the Next.js client via:
- `VOLTTRON_CAMPUS`
- `VOLTTRON_BUILDING`

## Creating a New Deployment Template

### Step 1: Create the Directory

Create a new directory using the format `{CAMPUS}-{BUILDING}` (lowercase):

```bash
mkdir -p aems-app/client/public/static/templates/example-building1
```

### Step 2: Copy Template Files

Copy the template files from the default templates:

```bash
# Windows PowerShell
Copy-Item aems-app/client/public/static/templates/default/*.html aems-app/client/public/static/templates/example-building1/

# Or on Linux/Mac
cp aems-app/client/public/static/templates/default/*.html aems-app/client/public/static/templates/example-building1/
```

### Step 3: Edit Content Files

Edit the `welcome.html` and/or `info.html` files to customize:

- Building-specific information
- Campus details and location
- Contact information
- Site-specific procedures
- Local support resources
- Custom branding or logos

### Step 4: Preview Your Changes

Navigate to the dev preview tool in your browser (no login required):

```
http://localhost:3000/dev/templates
```

1. Select your deployment from the dropdown
2. Use tabs to switch between Welcome and Info pages
3. Make edits to template files
4. Click "Refresh" to see changes

### Step 5: Add to Production (Optional)

To use your templates in the actual application:

1. Update `aems-app/.env`:
   ```bash
   VOLTTRON_CAMPUS=EXAMPLE
   VOLTTRON_BUILDING=BUILDING1
   ```

2. Restart the application:
   ```bash
   cd aems-app
   ./start-services.sh  # or start-services.ps1 on Windows
   ```

3. Navigate to `/welcome` or `/info` in the app to see your templates

## Development Workflow

### Using the Dev Preview Tool

1. **Navigate to** `/dev/templates` in your browser (accessible without login)

2. **Select deployment** from the dropdown to instantly view different templates

3. **Switch between tabs** (Welcome/Info) to preview different pages

4. **Edit template files** in `/static/templates/{deployment}/*.html`

5. **Click "Refresh"** button to reload and see your changes

### Dev Preview Tool Features

- **Publicly accessible**: No login required - templates are public content
- **Deployment selector**: Switch between any deployment instantly to compare templates
- **Tabbed interface**: View Welcome and Info pages
- **Uses Custom component**: Same component used in production - shows exactly how it will appear
- **Environment display**: Shows current VOLTTRON_CAMPUS and VOLTTRON_BUILDING settings
- **Path display**: Shows which template file is being loaded
- **Quick links**: Button to open template folder in new tab
- **Theme support**: Inherits app's light/dark mode styling

## Template HTML Structure

Template files are **pure HTML fragments** that get injected into the application. They should:

1. **NOT include** `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` tags
2. **NOT include** `<link>` tags for CSS (styling is inherited automatically from the app)
3. **NOT include** `<script>` tags for external scripts (unless absolutely necessary)
4. **Start directly** with a container div (`welcome-container` or `info-container`)
5. **Use absolute paths** for all images and assets

Example structure:
```html
<div class="welcome-container">
  <div class="welcome-header">
    <h1>Your Title</h1>
    <p class="text-muted">Subtitle</p>
  </div>
  <div class="welcome-content">
    <img src="/static/templates/default/images/logo.png" alt="Logo">
    <!-- Your content here -->
  </div>
</div>
```

### Image Paths

**Always use absolute paths** for images:

```html
<!-- Default deployment images -->
<img src="/static/templates/default/images/fig1.jpg" alt="Description">

<!-- Custom deployment images -->
<img src="/static/templates/pnnl-rob/images/logo.png" alt="Logo">
```

Absolute paths ensure images work correctly:
- ✅ When injected into `/welcome` or `/info` pages
- ✅ In the `/dev/templates` preview tool
- ✅ Regardless of the current page URL
- ✅ In both development and production builds

**Why absolute paths?**
When HTML is injected via `dangerouslySetInnerHTML`, relative paths resolve from the current page URL (e.g., `/welcome`), not from the template file location. Absolute paths starting with `/static/` ensure the browser always finds the correct image.

### Available CSS Classes

Template files automatically inherit these CSS classes from the main application:

**Layout & Structure:**
- `.welcome-container` / `.info-container` - Main content wrapper
- `.welcome-header` / `.info-header` - Header section
- `.welcome-content` / `.info-content` - Content section
- `.container` - Responsive container
- `.section` - Section spacing

**Typography & Styling:**
- `.text-center` - Center-align text
- `.text-muted` - Muted text color
- `.feature-list` - Styled list for features

**Blueprint.js Components:**
All Blueprint.js CSS classes are available (buttons, cards, callouts, etc.)

## Features

### No Rebuild Required

Once the template system is in place, you can:
- Edit HTML files directly in the template directories
- Changes take effect immediately (no rebuild needed)
- Simply refresh the browser to see updates
- Use the dev preview tool to test before deploying

### Automatic Styling

All templates automatically inherit CSS from the main AEMS application. This ensures:
- **Consistent look and feel** with the rest of the app
- **Automatic dark mode support** - templates adapt to user's theme preference
- **Responsive design** - templates work on all screen sizes
- **Blueprint.js styling** - access to all component styles
- **No external CSS files needed** - everything is inherited

### Graceful Fallbacks

The system provides multiple fallback levels:
1. If deployment-specific template doesn't exist → use default template
2. If default template doesn't exist → use legacy static file
3. If all fail → show error notification

## Example Deployments

### PNNL-ROB (Pacific Northwest National Laboratory - Research Operations Building)

Located at: `/static/templates/pnnl-rob/`

This deployment includes:
- Building-specific welcome information for PNNL ROB
- Custom content tailored to the facility

**Preview:** Select "PNNL-ROB" in `/dev/templates`

### Default Templates

Located at: `/static/templates/default/`

These templates include:
- Generic AEMS welcome message
- Comprehensive system configuration guide with 15 figures
- Template system documentation

**Preview:** Select "Default" in `/dev/templates`

## Customization Tips

### Adding Images

1. **Create an images directory** in your template folder:
   ```bash
   mkdir -p aems-app/client/public/static/templates/example-building/images
   ```

2. **Add your images** to this directory

3. **Reference images using absolute paths**:
   ```html
   <img src="/static/templates/example-building/images/logo.png" alt="Logo">
   ```

### Custom Inline Styles

Template files inherit the application's CSS. Add inline styles when needed:

```html
<div style="background-color: #f0f0f0; padding: 10px;">
  Custom styled content
</div>
```

**Note:** Inline styles should be used sparingly. Most styling needs are met by the inherited CSS classes.

### Adding Custom Behavior

You can add `<script>` tags to template files for dynamic behavior:

```html
<div id="status">Loading...</div>

<script>
  // Fetch and display real-time data
  fetch('/api/status')
    .then(res => res.json())
    .then(data => {
      document.getElementById('status').textContent = data.status;
    });
</script>
```

## Troubleshooting

### Template Not Loading in Application

1. **Check environment variables** in `aems-app/.env`:
   - Verify `VOLTTRON_CAMPUS` is set correctly
   - Verify `VOLTTRON_BUILDING` is set correctly

2. **Check directory naming**:
   - Must match exactly: `{CAMPUS}-{BUILDING}` (all lowercase)
   - Example: `pnnl-rob` not `PNNL-ROB` or `pnnl_rob`

3. **Check file existence**:
   - Ensure `welcome.html` and/or `info.html` exist in the directory

4. **Restart the application** after changing environment variables

5. **Use dev preview tool** (`/dev/templates`) to test before deploying

### Dev Preview Tool Issues

1. **Page not loading**: 
   - Ensure dev server is running: `npm run dev` in `aems-app/client`
   - No login required - page is publicly accessible

2. **Template not displaying**:
   - Check browser console (F12) for errors
   - Verify template file exists at the path shown
   - Try selecting a different deployment to isolate the issue

3. **Deployment selector not working**:
   - Ensure you're selecting from the dropdown, not just reading the display
   - Check that the template file exists for the selected deployment
   - Look for 404 errors in browser console

### Images Not Displaying

1. **Check image paths** - Must use absolute paths starting with `/static/templates/`
   ```html
   <!-- Correct -->
   <img src="/static/templates/default/images/fig1.jpg">
   
   <!-- Incorrect -->
   <img src="images/fig1.jpg">
   <img src="./images/fig1.jpg">
   <img src="../default/images/fig1.jpg">
   ```

2. **Verify images directory exists** in the template folder

3. **Check file extensions** - Ensure they match exactly (case-sensitive on Linux)

4. **Check browser console** for 404 errors showing the full path being requested

5. **Verify file exists** at the absolute path shown in the error

### Styling Issues

1. **Content looks unstyled or wrong**:
   - Templates should NOT include `<link>` tags for CSS
   - Remove any external CSS links from template files
   - Styling is inherited automatically from the app

2. **Colors look wrong**:
   - Template inherits colors from app theme (light/dark mode)
   - Don't force colors like `background: white` in inline styles
   - Use CSS classes like `.text-muted` instead

3. **Test in both light and dark modes**:
   - Check appearance in both themes
   - Avoid hardcoded colors that don't adapt

4. **Hard refresh browser**: 
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### Common Mistakes to Avoid

❌ **Don't include CSS links:**
```html
<!-- WRONG - Don't do this -->
<link rel="stylesheet" href="../shared/styles.css">
<link rel="stylesheet" href="styles.css">
```

❌ **Don't use relative image paths:**
```html
<!-- WRONG - Don't do this -->
<img src="images/logo.png">
<img src="../default/images/fig1.jpg">
```

❌ **Don't include full HTML document structure:**
```html
<!-- WRONG - Don't do this -->
<!DOCTYPE html>
<html>
<head>...</head>
<body>...</body>
</html>
```

✅ **Do use absolute image paths:**
```html
<!-- CORRECT -->
<img src="/static/templates/default/images/logo.png">
```

✅ **Do start with container div:**
```html
<!-- CORRECT -->
<div class="welcome-container">
  <h1>Content</h1>
</div>
```

## Best Practices

1. **Keep templates simple**: These are informational pages, not full applications
2. **Use semantic HTML**: Proper heading hierarchy (`<h1>`, `<h2>`, etc.), lists, tables
3. **Test with dev tool first**: Use `/dev/templates` to verify changes quickly
4. **Use absolute paths for all assets**: Images, links, etc.
5. **No external CSS**: Templates inherit all styling from the app
6. **Test in both themes**: Verify appearance in light and dark mode
7. **Use inherited CSS classes**: Leverage Blueprint.js and app styles
8. **Document customizations**: Add HTML comments to explain custom sections
9. **Version control**: Keep templates in git for change tracking
10. **Consistent naming**: Follow the `{campus}-{building}` convention strictly (lowercase)

## Support

For questions or issues with the template system:
- Review this README thoroughly
- Use the dev preview tool at `/dev/templates` for testing
- Check the example templates in `default/` and `pnnl-rob/`
- Verify your setup matches the documented structure
- Check browser console for error messages
- Consult the AEMS documentation
- Contact the development team

## Quick Reference

**File Structure:**
```
templates/
├── default/
│   ├── images/*.jpg
│   ├── welcome.html  ← Pure HTML, no CSS link, absolute image paths
│   └── info.html     ← Pure HTML, no CSS link, absolute image paths
└── {campus}-{building}/
    ├── images/*.jpg  (optional)
    ├── welcome.html  ← Pure HTML, no CSS link, absolute image paths
    └── info.html     (optional)
```

**Image Path Template:**
```html
<img src="/static/templates/{deployment}/images/{filename}" alt="Description">
```

**Dev Tool URL:**
```
http://localhost:3000/dev/templates
```

**Environment Variables:**
```bash
VOLTTRON_CAMPUS=YOUR_CAMPUS
VOLTTRON_BUILDING=YOUR_BUILDING
