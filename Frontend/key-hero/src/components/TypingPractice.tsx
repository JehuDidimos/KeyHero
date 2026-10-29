import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import type { Difficulty } from "../Interfaces/Interfaces";

const easy: Difficulty = {
  difficultyLevel: "easy",
  alphabetPool: "asdfjkl",
};
const medium: Difficulty = {
  difficultyLevel: "medium",
  alphabetPool: "asdfghjklqweruiop",
};
const hard: Difficulty = {
  difficultyLevel: "hard",
  alphabetPool: "abcdefghijklmnopqrstuvwxyz",
};
const extreme: Difficulty = {
  difficultyLevel: "extreme",
  alphabetPool: "abcdefghijklmnopqrstuvwxyz1234567890",
};

  function createRound(difficultyPool: string) {
    const aplhabetSelection = Array.from(
      { length: 20 },
      () =>
        difficultyPool[
          Math.floor(Math.random() * difficultyPool.length)
        ],
    );

    return {
      letters: aplhabetSelection
    };
  }

export default function TypingPractice() {
  const [difficulty, setDifficulty] = useState(medium);
  const [round, setRound] = useState(createRound(difficulty.alphabetPool));
  const inputRef = useRef<HTMLInputElement>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const attemptedCount = wrongCount + correctCount;
  const newLettersButton = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.nativeEvent.isComposing ||
      !/^[a-z0-9]$/i.test(event.key)
    )
      return;

    event.preventDefault();
    const key = event.key.toLowerCase();
    if (key === round.letters.at(0)) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    const letter = difficulty.alphabetPool[Math.floor(Math.random() * difficulty.alphabetPool.length)];
    setRound((current) => ({
      letters: [...current.letters.slice(1), letter]
    }));
    // if(isLastLetter){
    //   restart()
    // }
  }

  function updateDifficuly(difficultySelection: Difficulty){
    setDifficulty(difficultySelection)
    setRound(createRound(difficultySelection.alphabetPool))
    setWrongCount(0);
    setCorrectCount(0);
  }


  function restart() {
    setRound(createRound(difficulty.alphabetPool));
    inputRef.current?.focus();
    setWrongCount(0);
    setCorrectCount(0);
  }

  function refocus(event: FocusEvent<HTMLInputElement>) {
    if (event.relatedTarget !== newLettersButton.current) {
      inputRef.current?.focus();
    }
  }

  return (
    <main>
      <div role="group" aria-label="Difficulty">
        <button type="button" onClick={() => updateDifficuly(easy)}>
          Easy
        </button>{" "}
        <button type="button" onClick={() => updateDifficuly(medium)}>
          Medium
        </button>{" "}
        <button type="button" onClick={() => updateDifficuly(hard)}>
          Hard
        </button>{" "}
        <button type="button" onClick={() => updateDifficuly(extreme)}>
          Extreme
        </button>
      </div>
      <h1>Typing practice {difficulty.difficultyLevel}</h1>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "2rem",
          marginBlock: "1rem",
        }}
      >
        {round.letters.map((letter, index) => {
          return (
            <span
              key={index}
              aria-label={`${letter}`}
              style={{
                display: "inline-block",
                marginRight: "0.5rem",
                textDecoration: index === 0 ? "underline" : undefined,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>
        <input
          ref={inputRef}
          type="text"
          value=""
          readOnly
          autoComplete="off"
          onKeyDown={handleKeyDown}
          aria-describedby="typing-result"
          autoFocus
          onBlur={refocus}
          placeholder={round.letters.toString().replaceAll(",", "")}
        />
      <p id="typing-result" role="status">
        {correctCount} correct / {wrongCount} wrong / {attemptedCount}{" "}
        attempted
      </p>
      <button ref={newLettersButton} type="button" onClick={restart}>
        New letters
      </button>
    </main>
  );
}
