export const flash = {
  message: null as string | null,
  type: null as "success" | "error" | "warning" | "info" | null,

  pop() {
    const t = this.type;
    const m = this.message;
    this.type = null;
    this.message = null;
    return { type: t, message: m };
  },
};
