export const pointerGate = { dragged: false };

export const hoverTip = {
  el: null as HTMLDivElement | null,
  title: "",
  show(title: string, author: string, x: number, y: number) {
    const el = this.el;
    if (!el) return;
    if (this.title !== title) {
      this.title = title;
      el.replaceChildren();
      const strong = document.createElement("strong");
      strong.textContent = title;
      const small = document.createElement("span");
      small.textContent = author;
      el.append(strong, small);
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
