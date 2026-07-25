---
name: arabic-ai-tool-review
description: Create or review AI tools for ArabAIHub and return them in the required JavaScript object format.
---

# Arabic AI Tool Review

Use this skill when the user wants to:
- add a new tool to ArabAIHub
- review an existing tool
- generate a tool card or tool entry

## Required output

Always return the result as a clean JavaScript object ready to be copied into the tools array.

```js
{
  name: "",
  cat: "",
  price: "",
  free: true/false,
  desc: "",
  pros: [],
  cons: [],
  arabic: 1,
  link: ""
}
```

## Field rules

- name: Official tool name
- cat: One of these categories only -> "كتابة" or "صور" or "فيديو" or "صوت" or "إنتاجية"
- price: Clear Arabic price text, for example: "مجاني" or "شهرياً $20 / مجاني" or "يبدأ من $10"
- free: true if the tool has a usable free plan, false otherwise
- desc: Short natural Arabic description, maximum 15 words, focused on Arabic performance
- pros: Array of 2 to 4 short Arabic strengths
- cons: Array of 1 to 3 short Arabic weaknesses; be honest
- arabic: Score from 1 to 5 based only on Arabic language quality, including Fusha and dialects
- link: Official website link

## Writing style

- Use natural, direct, and slightly informal Arabic in the same spirit as ArabAIHub
- Be honest, not promotional
- Focus heavily on how well the tool understands and generates Arabic

## Workflow

1. Identify the tool and verify its official name and website.
2. Choose the correct category from the allowed list.
3. Determine the pricing and whether a usable free plan exists.
4. Write a short Arabic description centered on Arabic support.
5. Add realistic strengths and weaknesses.
6. Score Arabic quality from 1 to 5 based only on Arabic performance.
7. Return only the final JavaScript object, with no extra explanation.

## Quality checklist

- The output is a valid JavaScript object
- The category is one of the allowed values
- The Arabic description stays within 15 words
- The pros and cons arrays are realistic and concise
- The Arabic score reflects Arabic quality only
- The result is ready to paste directly into the tools array
