/** Inline vector artwork; no external images or fonts are needed. */
export function componentIcon(index) {
  const bodies = [
    '<path d="M8 30H3m53 0h5" stroke="#decaa0" stroke-width="5"/><rect x="9" y="16" width="46" height="34" rx="15" fill="#ffd28e"/><path d="M18 18v13m9-14v11m18-10v12" stroke="#d58b61" stroke-width="5"/><path d="M18 49v6m28-6v6"/>',
    '<rect x="25" y="5" width="14" height="8" rx="3" fill="#8ebf77"/><rect x="14" y="12" width="36" height="44" rx="11" fill="#a7e6a0"/><path d="M24 21h6m-3-3v6m12-3h5" stroke="#4b8d64" stroke-width="2.5"/><path d="M19 26v13" stroke="#eaffd9" stroke-width="3"/>',
    '<path d="M32 8V4m-21 18H5m6 10H5m6 10H5m48-20h6m-6 10h6m-6 10h6" stroke="#8ab9d6" stroke-width="4"/><circle cx="32" cy="5" r="3" fill="#ffdc88"/><rect x="11" y="12" width="42" height="42" rx="12" fill="#a5d7ff"/><rect x="17" y="24" width="30" height="22" rx="8" fill="#def3ff"/><path d="M23 18h7" stroke="#f1fbff" stroke-width="3"/>',
    '<path d="m32 5 19 15 6 17-25 22L7 37l6-17Z" fill="#d6b6ff"/><path d="m32 5-7 21 7 33 8-33Z" fill="#ecdbff" stroke="none"/><path d="m13 20 12 6 15 0 11-6M7 37l18-11m15 0 17 11" fill="none" stroke="#a880ce" stroke-width="1.7"/><path d="m19 14 3 2" stroke="#fff" stroke-width="3"/>',
    '<path d="M24 17q-9-6-10 4m26-4q9-6 10 4" fill="none" stroke="#ffb0a5" stroke-width="4"/><path d="M16 29q0-12 16-12t16 12l7 14q3 11-10 11H19Q6 54 9 43Z" fill="#ffafa5"/><path d="M32 17V9"/><circle cx="32" cy="7" r="4" fill="#ffe49e"/><path d="m20 25-3 5" stroke="#ffe1ce" stroke-width="3"/>',
    '<path d="M22 51v8m20-8v8" stroke="#b5d9d5" stroke-width="4"/><rect x="12" y="13" width="40" height="40" rx="12" fill="#8fe1db"/><ellipse cx="32" cy="14" rx="19" ry="7" fill="#c4f7e7"/><path d="M26 14h12m-6-3v6" stroke="#5a9692" stroke-width="2"/><path d="M18 25v13" stroke="#cefff1" stroke-width="3"/>',
  ];
  const face =
    '<g stroke="#344546" stroke-width="2.4" stroke-linecap="round"><path d="M24 33v3m16-3v3"/><path d="M28 42q4 4 8 0" fill="none"/><g stroke="none" fill="#ef8b8c" opacity=".55"><ellipse cx="19" cy="40" rx="3" ry="2"/><ellipse cx="45" cy="40" rx="3" ry="2"/></g></g>';
  return (
    '<svg class="component-art" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="18" ry="3" fill="#193d3318"/><g stroke="#344546" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    bodies[index] +
    face +
    '</g></svg>'
  );
}
