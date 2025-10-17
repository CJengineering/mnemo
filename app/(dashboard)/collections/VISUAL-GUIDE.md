# Visual Guide: Dynamic Column Visibility Feature

## 🎯 What You'll See

### 1. The Columns Button

Located in the toolbar next to the Filter button:

```
┌─────────────────────────────────────────────────────┐
│  Search...                 🔽 Filter  📊 Columns(4/7)│
└─────────────────────────────────────────────────────┘
```

### 2. Column Selector Dropdown

When you click the Columns button:

```
                                    ┌─────────────────────────────┐
                                    │ Visible Columns    Reset    │
                                    ├─────────────────────────────┤
                                    │ ☑ Title                     │
                                    │ ☑ Event Date                │
                                    │ ☑ Status                    │
                                    │ ☑ City                      │
                                    │ ☐ Type                      │
                                    │ ☐ Description               │
                                    │ ☐ Slug                      │
                                    ├─────────────────────────────┤
                                    │        Close                │
                                    └─────────────────────────────┘
```

### 3. Dynamic Table

The table updates instantly when you toggle columns:

**Before (all columns visible):**

```
┌──────────┬────────────┬─────────┬──────┬─────────┬──────────────┬────────────┐
│ Title    │ Event Date │ Status  │ City │ Type    │ Description  │ Slug       │
├──────────┼────────────┼─────────┼──────┼─────────┼──────────────┼────────────┤
│ Workshop │ Dec 15     │ 🟢 Pub  │ MIT  │ Hybrid  │ A workshop...│ workshop-1 │
└──────────┴────────────┴─────────┴──────┴─────────┴──────────────┴────────────┘
```

**After (hiding Type, Description, Slug):**

```
┌──────────┬────────────┬─────────┬──────┐
│ Title    │ Event Date │ Status  │ City │
├──────────┼────────────┼─────────┼──────┤
│ Workshop │ Dec 15     │ 🟢 Pub  │ MIT  │
└──────────┴────────────┴─────────┴──────┘
```

## 📊 Collection-Specific Columns

### Events Collection

```
Available Columns:
☑ Title          (always useful)
☑ Event Date     (when is it?)
☑ Status         (published/draft)
☑ City           (where is it?)
☐ Type           (in-person/virtual/hybrid)
☐ Description    (details)
☐ Slug           (technical)
```

### Team Collection

```
Available Columns:
☑ Name           (member name)
☑ Position       (job title)
☑ Category       (Leadership/Team/etc)
☑ Status         (published/draft)
☐ Order          (display order number)
☐ Slug           (technical)
```

### Programme Collection

```
Available Columns:
☑ Name           (programme name)
☑ Type           (Centre/Fund/Lab/etc)
☑ Mission        (description)
☑ Status         (published/draft)
☐ Year           (year established)
☐ Slug           (technical)
```

### Partner Collection

```
Available Columns:
☑ Name           (partner name)
☑ Description    (about the partner)
☑ Status         (published/draft)
☐ Website        (clickable link)
☐ Slug           (technical)
```

## 🎨 Visual Elements

### Status Badges

```
🟢 Published   (green badge with border)
🟡 Draft       (yellow badge with border)
⚪ Other       (gray badge)
```

### Category/Type Badges

```
🟣 Leadership      (purple - team category)
🔵 Centre         (blue - programme type)
🟢 In Person      (indigo - attendance type)
🟡 ⭐ Featured    (yellow - featured flag)
```

### Text Display

```
Title:         Bold white text, 2 lines max
Description:   Gray text, 2 lines max, HTML stripped
Date:          Gray text, formatted (e.g., "Dec 15, 2024")
Slug:          Monospace font, small gray text
Links:         Blue underlined, opens in new tab
```

## 🔄 Workflow Example

### Scenario: Managing Events for a Conference

**Step 1:** Open Events Collection

- See default columns: Title, Event Date, Status, City

**Step 2:** Need to see attendance type

- Click "Columns" button
- Check "Type" checkbox
- Table now shows: Title, Event Date, Status, City, Type

**Step 3:** Don't need City for virtual events

- Uncheck "City" checkbox
- Table now shows: Title, Event Date, Status, Type

**Step 4:** Preferences saved!

- Refresh the page
- Your column selection is remembered
- Other collections (Team, Programme) have their own settings

**Step 5:** Reset if needed

- Click "Columns" button
- Click "Reset" at the top
- Back to default columns

## 🎯 Use Cases

### Use Case 1: Content Editor

_"I only care about Title, Status, and Date"_

- Hide all other columns
- Focus on publishing workflow
- Quick scan of what needs publishing

### Use Case 2: Technical User

_"I need to see Slugs for SEO work"_

- Show Slug column
- Keep Title and Status
- Hide descriptions to save space

### Use Case 3: Event Manager

_"Show me all event logistics"_

- Show: Title, Date, City, Type
- Hide: Description, Slug
- Perfect for planning view

### Use Case 4: Team Lead

_"Order team members by display order"_

- Show: Name, Position, Order
- Hide: Category, Slug
- Easy drag-drop ordering (future feature)

## 💡 Tips & Tricks

### Tip 1: Mobile Friendly

- Fewer columns = better mobile experience
- Hide less important columns for mobile editing

### Tip 2: Performance

- Hiding columns doesn't slow down the page
- All data is still loaded, just not displayed

### Tip 3: Per-Collection

- Events settings ≠ Team settings
- Each collection remembers separately
- Switch freely without losing preferences

### Tip 4: Defaults Are Smart

- Each collection has sensible defaults
- Based on most common use cases
- Customize as needed for your workflow

## 🎊 Benefits Summary

✅ **Cleaner Interface**

- See only what you need
- Less horizontal scrolling
- Reduced cognitive load

✅ **Faster Workflow**

- Quick access to important info
- Less time searching for data
- More efficient editing

✅ **Personalized Experience**

- Everyone can customize their view
- Preferences persist forever
- No impact on other users

✅ **Context-Aware**

- Events show event-relevant columns
- Team shows team-relevant columns
- Each collection type optimized

## 🚀 Next Steps

1. **Try it out!**

   - Go to http://localhost:3001/collections
   - Click "Columns" button
   - Toggle some columns

2. **Find Your Perfect View**

   - Experiment with different combinations
   - See what works for your workflow
   - Preferences save automatically

3. **Share Feedback**
   - Missing a column you need?
   - Want column reordering?
   - Let the dev team know!

---

**Enjoy your new customizable table experience! 🎉**
