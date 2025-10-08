# Chakra UI v3 Development Instructions for GitHub Copilot

This project uses **Chakra UI v3** (built on React and TypeScript). **Always prioritize v3 conventions, component names, and prop changes.**

## Core Component & API Rules

1.  **Imports:**
    * **Core Components:** Import foundational components (e.g., `Alert`, `Avatar`, `Button`, `Card`, `Field`, `Table`) directly from **`@chakra-ui/react`**.
    * **Custom/Migrated Components:** Use project-specific imports (e.g., from a local `components/ui` directory) for components that are often wrapped or migrated (e.g., `Checkbox`, `Drawer`, `Radio`, `Menu`, `Dialog`, `Tooltip`).

2.  **Naming & Prop Changes (Migration Focus):**
    * **Boolean Props:** The prefix `is` has been removed. Change boolean props from `isOpen` to **`open`**, `isDisabled` to **`disabled`**, `isInvalid` to **`invalid`**, and `isRequired` to **`required`**.
    * **Colors:** Replace the old `colorScheme` prop with the new **`colorPalette`** prop.
    * **Toast:** Use the new imperative API: **`toaster.create()`** instead of the deprecated `useToast()` hook.
    * **Modal/Dialog:** The `Modal` component is renamed to **`Dialog`**. Use `open` and `onOpenChange` props instead of `isOpen` and `onClose`.
    * **Stack:** Always use **`VStack`** or **`HStack`** for directionally explicit layouts. Do **not** use the generic `Stack` component.
    * **Button Icons:** Button icons are passed as **children** (e.g., `<Button><Icon /></Button>`) and are **not** props like `leftIcon` or `rightIcon`.
    * **Form Control:** Use the **`Field`** component instead of the old `FormControl`. Use **`Field.ErrorText`** instead of `FormErrorMessage`.

3.  **Component Structure:**
    * Favor **Compound Components** for complex components (e.g., `PinInput.Root`, `PinInput.Control`, `PinInput.Label`, `ProgressCircle.Range`).
    * `Divider` is renamed to **`Separator`**.
    * `TableContainer` is renamed to **`Table.ScrollArea`**.

## Styling & Theme Rules

1.  **Nested Styles:** When applying nested CSS selectors, use the **`css`** prop instead of `sx`, and the **`&`** (ampersand) is **required** for proper scoping.
    * *Example (Correct):* `<Box css={{ "& svg": { color: "red.500" } }} />`
    * *Example (Incorrect):* `<Box sx={{ svg: { color: "red.500" } }} />`

2.  **Gradients:** Use the new dedicated gradient props instead of the combined `bgGradient` string.
    * *Example (Correct):* `<Box bgGradient="to-r" gradientFrom="red.200" gradientTo="pink.500" />`
    * *Example (Incorrect):* `<Box bgGradient="linear(to-r, red.200, pink.500)" />`

3.  **Spacing:** The `spacing` prop on `VStack`/`HStack` is now **`gap`**.

4.  **Theming/Color Modes:** Color mode logic (like `useColorModeValue`, `ColorModeProvider`) is removed. The project uses a third-party solution like **`next-themes`** or CSS classes for dark mode support. **Do not generate Chakra-specific color-mode hooks.**

## Removed Packages

The following package dependencies and their related APIs have been removed from the core library. **Do not use them in new code:**

* **Styling:** `@emotion/styled` and `framer-motion`.
* **Icons:** Use **`lucide-react`** or **`react-icons`** instead of `@chakra-ui/icons`.
* **Hooks:** Use general utility libraries like **`react-use`** or **`usehooks-ts`** instead of `@chakra-ui/hooks`.
* **Next.js:** Use the native **`asChild`** prop instead of `@chakra-ui/next-js`.
