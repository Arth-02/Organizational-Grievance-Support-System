const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MIN_CHAR = ALPHABET[0];
const MAX_CHAR = ALPHABET[ALPHABET.length - 1];
const BASE = ALPHABET.length;

class LexoRank {
  /**
   * Get a rank between two existing ranks
   * @param {string|null} prev - Previous rank (null if inserting at beginning)
   * @param {string|null} next - Next rank (null if inserting at end)
   * @returns {string} - A rank that sorts between prev and next
   */
  static getMiddleRank(prev, next) {
    if (!prev && !next) {
      throw new Error("Please provide ranks to get the middle rank.");
    }

    // If no prev, generate a rank before next
    if (!prev) {
      return this._getRankBefore(next);
    }

    // If no next, generate a rank after prev
    if (!next) {
      return this.generateNextRank(prev);
    }

    // Ensure prev < next
    if (prev >= next) {
      throw new Error("prev must be less than next");
    }

    // Calculate middle rank between prev and next
    return this._getMiddleBetween(prev, next);
  }

  /**
   * Get a rank before the given rank
   * @param {string} rank - The rank to insert before
   * @returns {string} - A rank that sorts before the given rank
   */
  static _getRankBefore(rank) {
    if (!rank || rank.length === 0) {
      return this.getInitialRank();
    }

    const firstCharIndex = ALPHABET.indexOf(rank[0]);
    
    // If first char is not '0', we can just use the previous character
    if (firstCharIndex > 0) {
      return ALPHABET[firstCharIndex - 1];
    }

    // First char is '0', need to find a position
    // Look for first non-'0' character
    for (let i = 0; i < rank.length; i++) {
      const charIndex = ALPHABET.indexOf(rank[i]);
      if (charIndex > 0) {
        // Return prefix of '0's plus previous character
        return rank.substring(0, i) + ALPHABET[charIndex - 1];
      }
    }

    // All characters are '0', append middle character
    return rank + ALPHABET[Math.floor(BASE / 2)];
  }

  /**
   * Calculate middle rank between two ranks
   * @param {string} prev - Previous rank
   * @param {string} next - Next rank
   * @returns {string} - A rank between prev and next
   */
  static _getMiddleBetween(prev, next) {
    // Pad the shorter string with MIN_CHAR for prev and MAX_CHAR for next
    const maxLen = Math.max(prev.length, next.length);
    let p = prev;
    let n = next;

    // Convert ranks to numeric values for calculation
    let pValue = 0;
    let nValue = 0;
    
    for (let i = 0; i < maxLen; i++) {
      const pChar = p[i] || MIN_CHAR;
      const nChar = n[i] || MAX_CHAR;
      
      const pIndex = ALPHABET.indexOf(pChar);
      const nIndex = ALPHABET.indexOf(nChar);
      
      pValue = pValue * BASE + pIndex;
      nValue = nValue * BASE + nIndex;
    }

    // If values are adjacent, we need more precision
    if (nValue - pValue <= 1) {
      // Add more precision by appending middle character to prev
      return prev + ALPHABET[Math.floor(BASE / 2)];
    }

    // Calculate middle value
    const midValue = Math.floor((pValue + nValue) / 2);

    // Convert back to string
    let result = "";
    let remaining = midValue;
    
    for (let i = 0; i < maxLen; i++) {
      const divisor = Math.pow(BASE, maxLen - 1 - i);
      const charIndex = Math.floor(remaining / divisor);
      result += ALPHABET[charIndex];
      remaining = remaining % divisor;
    }

    // Remove trailing MIN_CHARs but keep at least one character
    while (result.length > 1 && result[result.length - 1] === MIN_CHAR) {
      result = result.slice(0, -1);
    }

    // Verify the result is actually between prev and next
    if (result <= prev) {
      // Fallback: append middle character to prev
      return prev + ALPHABET[Math.floor(BASE / 2)];
    }

    if (result >= next) {
      // Fallback: append middle character to prev
      return prev + ALPHABET[Math.floor(BASE / 2)];
    }

    return result;
  }

  /**
   * Get the initial rank for the first item
   * @returns {string} - Middle character of the alphabet
   */
  static getInitialRank() {
    const midChar = ALPHABET[Math.floor(BASE / 2)];
    return midChar;
  }

  /**
   * Generate the next rank after the current rank
   * @param {string} currentRank - Current rank
   * @returns {string} - Next rank that sorts after currentRank
   */
  static generateNextRank(currentRank) {
    if (!currentRank) return this.getInitialRank();
    
    const lastCharIndex = ALPHABET.indexOf(currentRank[currentRank.length - 1]);
    
    // If we can increment the last character
    if (lastCharIndex < BASE - 1) {
      return currentRank.slice(0, -1) + ALPHABET[lastCharIndex + 1];
    }
    
    // Last character is at max, need to handle overflow
    if (currentRank.length === 1) {
      // Single character at max, append MIN_CHAR
      return currentRank + MIN_CHAR;
    }
    
    // Recursively increment the prefix and append MIN_CHAR
    return this.generateNextRank(currentRank.slice(0, -1)) + MIN_CHAR;
  }
}

module.exports = LexoRank;
