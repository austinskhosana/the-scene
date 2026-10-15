export const sceneAuthAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full border-0! bg-transparent! shadow-none!",
    card: "w-full border-0! bg-transparent! p-0! shadow-none!",
    header: "hidden",
    main: "gap-4",
    socialButtonsRoot: "order-3 gap-3",
    socialButtonsBlockButton: "scene-social-button h-(--control-lg)! rounded-control! text-fg!",
    socialButtonsBlockButtonText: "font-medium! text-fg!",
    dividerRow: "order-2 gap-3",
    dividerLine: "bg-line!",
    dividerText: "text-sm! text-fg-2!",
    form: "order-1 gap-4",
    formFieldLabel: "text-sm! font-medium! text-fg!",
    formFieldInput:
      "h-(--control-lg)! rounded-field! border! border-line-strong! bg-field! px-3! text-base! text-fg! placeholder:text-fg-3! shadow-none! outline-none! focus:border-line-strong! focus-visible:border-line-strong! focus:outline-none! focus-visible:outline-none! focus:ring-0! focus-visible:ring-0!",
    formButtonPrimary:
      "glow glow-accent h-(--control-lg)! rounded-control! bg-accent! px-6! text-base! font-medium! text-on-accent! hover:bg-accent-hover!",
    footer: "bg-transparent! pt-1!",
    footerAction: "text-sm! text-fg-2!",
    footerActionLink: "font-medium! text-fg! underline! underline-offset-4! hover:underline!",
    footerItem: "hidden",
  },
} as const;
