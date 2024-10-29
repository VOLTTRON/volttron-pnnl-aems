/**
 * Used to mock module import during testing.
 */
const empty = function () {
  return {
    addEventListener: function () {},
  };
}

export default empty