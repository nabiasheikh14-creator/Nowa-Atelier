import * as THREE from "three";
import { SEED_BOOKS } from "../lib/seed-data";
import { placeCollection } from "../lib/placement";

const { placed, plaques } = placeCollection(SEED_BOOKS);
const real = placed.filter((book) => book.bookId);
const ids = new Set(real.map((book) => book.bookId));
const missing = SEED_BOOKS.filter((book) => !ids.has(book.id)).map((book) => book.title);
const forward = new THREE.Vector3();
const normal = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
let badSpines = 0;
for (const book of real) {
  quaternion.fromArray(book.quaternion);
  forward.set(0, 0, 1).applyQuaternion(quaternion);
  normal.set(book.normal[0], book.normal[1], book.normal[2]);
  if (forward.dot(normal) < 0.9) badSpines += 1;
}
const outside = placed.filter((book) => {
  const [x, y, z] = book.position;
  return Math.abs(x) > 6.5 || Math.abs(z) > 5.1 || y < 0 || y > 4.6 || book.position.some((value) => Number.isNaN(value));
});
console.log(
  JSON.stringify(
    {
      placed: placed.length,
      real: real.length,
      plaques: plaques.map((plaque) => plaque.label),
      missing,
      badSpines,
      outside: outside.length,
      lent: real.filter((book) => book.lent).length,
    },
    null,
    2,
  ),
);
if (missing.length || badSpines || outside.length || real.length !== SEED_BOOKS.length) {
  process.exit(1);
}
