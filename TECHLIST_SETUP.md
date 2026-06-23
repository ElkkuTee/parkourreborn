# Tech List Setup

The Tech List is fully backed by Firebase. Nothing is hardcoded into the website.

## Firebase Collection

Collection name:

```text
movement
```

Each document is one movement entry. The document ID is the visible entry name.

Example document ID:

```text
Mag Wavedash
```

## Fields

```ts
Aliases: string[]
Kind: "tech" | "concept" | "basic"
Steps: string[]
VideoUrl: string
TutorialUrl: string
```

`Kind` is normalized to lowercase by the API. Missing or invalid `Kind` values become `tech`.

Missing or non-array `Aliases` and `Steps` values become empty arrays. Missing URLs become empty strings.

## Optional Steps

Add `*` to the end of a step to mark it optional.

Example:

```text
Slide*
```

The page displays it as optional, but links and matching treat it as:

```text
Slide
```

## Step Linking

Steps link to another entry if the step name matches another movement document ID or one of its aliases.

Matching is case-insensitive.

## Example Documents

Collection: `movement`

Document ID: `Mag Bounce`

```ts
Aliases: []
Kind: "basic"
Steps: []
VideoUrl: "https://example.com/mag-bounce.mp4"
TutorialUrl: ""
```

Document ID: `Extended Coyote Time`

```ts
Aliases: ["ECT"]
Kind: "concept"
Steps: ["Coyote Time"]
VideoUrl: "https://example.com/extended-coyote-time.mp4"
TutorialUrl: ""
```

Document ID: `Mag Wavedash`

```ts
Aliases: ["Mag Wave Dash", "MWD"]
Kind: "tech"
Steps: ["Mag Bounce", "Wall Bounce", "Coyote Time", "Slide", "Jump"]
VideoUrl: "https://example.com/mag-wavedash.mp4"
TutorialUrl: "https://www.youtube.com/watch?v=example"
```

## Adding Or Editing Entries

1. Open Firebase Firestore.
2. Go to the `movement` collection.
3. Add a new document, or edit an existing one.
4. Use the movement name as the document ID.
5. Fill in the fields above.

The client reads `/api/techs`. Firestore is only read server-side through the Firebase Admin helper.
