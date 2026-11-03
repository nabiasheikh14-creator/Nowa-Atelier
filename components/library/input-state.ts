export const pointerGate = { dragged: false };

export const hoverTip = {
  el: null as HTMLDivElement | null,
  title: "",
  show(title: string, x: number, y: number) {
    const el = this.el;
    if (!el) return;
    if (this.title !== title) {
      this.title = title;
      el.textContent = title;
    }
    el.style.opacity = "1";
    el.style.transform = `translate3d(${Math.round(x + 16)}px, ${Math.round(y + 18)}px, 0)`;
  },
  hide() {
    if (!this.el) return;
    this.el.style.opacity = "0";
    this.title = "";
  },
};
