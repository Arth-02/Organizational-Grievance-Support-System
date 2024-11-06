// utils/lexorank.js

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MIN_CHAR = ALPHABET[0];
const MAX_CHAR = ALPHABET[ALPHABET.length - 1];
const BASE = ALPHABET.length;

class LexoRank {
  static getMiddleRank(prev, next) {
    if (!prev) prev = MIN_CHAR.repeat(6);
    if (!next) next = MAX_CHAR.repeat(6);
    
    // Ensure minimum length of 6 characters
    prev = prev.padEnd(6, MIN_CHAR);
    next = next.padEnd(6, MIN_CHAR);
    
    let rank = '';
    let i = 0;
    let carry = false;

    while (i < Math.max(prev.length, next.length)) {
      const prevChar = i < prev.length ? prev[i] : MIN_CHAR;
      const nextChar = i < next.length ? next[i] : MAX_CHAR;
      
      if (prevChar === nextChar && !carry) {
        rank += prevChar;
        i++;
        continue;
      }

      const prevIndex = ALPHABET.indexOf(prevChar);
      const nextIndex = ALPHABET.indexOf(nextChar);
      
      let midIndex;
      if (carry) {
        midIndex = Math.floor((prevIndex + BASE + nextIndex) / 2);
        carry = false;
      } else {
        midIndex = Math.floor((prevIndex + nextIndex) / 2);
      }
      
      if (midIndex === prevIndex) {
        rank += prevChar;
        carry = true;
      } else {
        rank += ALPHABET[midIndex];
        // Pad with middle character for remaining length
        const midChar = ALPHABET[Math.floor(BASE / 2)];
        rank = rank.padEnd(6, midChar);
        break;
      }
      
      i++;
    }

    return rank;
  }

  static getInitialRank() {
    // Returns a rank that would be in the middle of the possible range
    const midChar = ALPHABET[Math.floor(BASE / 2)];
    return midChar.repeat(6);
  }
  
  static generateNearestRank(currentRank, direction = 'after') {
    if (!currentRank) return this.getInitialRank();
    
    if (direction === 'after') {
      return this.getMiddleRank(currentRank, MAX_CHAR.repeat(6));
    } else {
      return this.getMiddleRank(MIN_CHAR.repeat(6), currentRank);
    }
  }
}

module.exports = LexoRank;
