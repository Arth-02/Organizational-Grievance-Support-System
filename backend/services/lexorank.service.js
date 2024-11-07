const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MIN_CHAR = ALPHABET[0];
const MAX_CHAR = ALPHABET[ALPHABET.length - 1];
const BASE = ALPHABET.length;

class LexoRank {
  static getMiddleRank(prev, next) {
    if (!prev && !next) {
      throw new Error("Please provide ranks to get the middle rank.");
    }
    if (!prev) {
      prev = "";
      if (next[0] !== "0") {
        prev = ALPHABET[ALPHABET.indexOf(next[0]) - 1];
        return prev;
      } else {
        for (let i = 0; i < next.length; i++) {
          if (next[i] === "0") {
            prev = prev + "0";
          } else {
            prev = prev + ALPHABET[ALPHABET.indexOf(next[i]) - 1];
            return prev;
          }
        }
        prev = prev + this.getInitialRank();
        return prev;
      }
    }
    if (!next) {
      return this.generateNextRank(prev);
    }
    let mid = "";
    let carry = false;

    for (let i = 0; i < Math.max(prev.length, next.length); i++) {
      const prevChar = prev[i] || MIN_CHAR;
      const nextChar = next[i] || MAX_CHAR;

      const prevIndex = ALPHABET.indexOf(prevChar);
      const nextIndex = ALPHABET.indexOf(nextChar);

      if (prevIndex === -1 || nextIndex === -1) {
        throw new Error("Invalid character in input ranks.");
      }

      // Calculate middle index and carry if needed
      let midIndex = Math.floor((prevIndex + nextIndex) / 2);
      mid += ALPHABET[midIndex];

      // Check for carry if characters are close in rank, e.g., "9" and "A"
      if (prevIndex + 1 === nextIndex || nextIndex + 1 === prevIndex) {
        carry = true;
      }
      if (prev[i] === undefined || next[i] === undefined) {
        break;
      }
    }

    // If carry is set, add extra precision by appending a middle character
    if (carry) {
      mid += ALPHABET[Math.floor(BASE / 2)];
    }

    return mid;
  }

  static getInitialRank() {
    const midChar = ALPHABET[Math.floor(BASE / 2)];
    console.log(`Initial rank: ${midChar}`);
    return midChar;
  }

  static generateNextRank(currentRank) {
    if (!currentRank) return this.getInitialRank();
    const nextChar =
      ALPHABET[ALPHABET.indexOf(currentRank[currentRank.length - 1]) + 1];
    if (nextChar) {
      return currentRank.slice(0, -1) + nextChar;
    } else {
      if (currentRank.length === 1) {
        return currentRank + MIN_CHAR;
      } else {
        return this.generateNextRank(currentRank.slice(0, -1)) + MIN_CHAR;
      }
    }
  }
}

module.exports = LexoRank;
