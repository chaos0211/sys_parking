document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll("#userTabs button");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");

      // 切换按钮激活状态
      tabButtons.forEach((b) => b.classList.remove("text-blue-600", "border-blue-600", "active"));
      btn.classList.add("text-blue-600", "border-blue-600", "active");

      // 切换内容
      tabPanes.forEach((pane) => {
        pane.classList.toggle("hidden", pane.id !== `tab-${tab}`);
      });
    });
  });
});