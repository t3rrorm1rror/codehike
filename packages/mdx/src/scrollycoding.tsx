import { visitAsync, toJSX } from "./unist-utils"
import { Node, Parent } from "unist"
import React from "react"
import {
  EditorSpring,
  EditorProps,
  EditorStep,
} from "@code-hike/mini-editor"
import { mapEditor, Code } from "./code"
import { reduceSteps } from "./code-files-reducer"
import { extractStepsInfo } from "./steps"
import {
  Scroller,
  Step as ScrollerStep,
} from "@code-hike/scroller"
import { Preview, PresetConfig } from "./preview"

export function Scrollycoding({
  children,
  editorSteps,
  codeConfig,
  presetConfig,
  start = 0,
}: {
  children: React.ReactNode
  editorSteps: EditorStep[]
  codeConfig: EditorProps["codeConfig"]
  start?: number
  presetConfig?: PresetConfig
}) {
  const stepsChildren = React.Children.toArray(children)

  const [stepIndex, setIndex] = React.useState(start)
  const tab = editorSteps[stepIndex]

  function onStepChange(index: number) {
    setIndex(index)
  }
  return (
    <section
      className={`ch-scrollycoding ${
        presetConfig ? "ch-scrollycoding-with-preview" : ""
      }`}
    >
      <div className="ch-scrollycoding-content">
        <Scroller onStepChange={onStepChange}>
          {stepsChildren.map((children, i) => (
            <ScrollerStep
              as="div"
              key={i}
              index={i}
              onClick={() => setIndex(i)}
              className="ch-scrollycoding-step-content"
              data-selected={
                i === stepIndex ? "true" : undefined
              }
            >
              {children}
            </ScrollerStep>
          ))}
        </Scroller>
      </div>
      <div className="ch-scrollycoding-sticker">
        <Code {...(tab as any)} codeConfig={codeConfig} />
        {presetConfig && (
          <Preview
            className="ch-scrollycoding-preview"
            files={tab.files}
            presetConfig={presetConfig}
          />
        )}
      </div>
    </section>
  )
}

export async function transformScrollycodings(
  tree: Node,
  config: { theme: any }
) {
  await visitAsync(
    tree,
    "mdxJsxFlowElement",
    async node => {
      if (node.name === "CH.Scrollycoding") {
        await transformScrollycoding(node, config)
      }
    }
  )
}
async function transformScrollycoding(
  node: Node,
  { theme }: { theme: any }
) {
  const editorSteps = await extractStepsInfo(
    node as Parent,
    { theme },
    "merge step with previous"
  )

  const presetAttribute = (node as any).attributes.find(
    (attr: any) => attr.name === "preset"
  )
  const presetConfig =
    presetAttribute &&
    (await getPresetConfig(presetAttribute.value))

  toJSX(node, {
    props: {
      codeConfig: { theme },
      editorSteps: editorSteps,
      presetConfig,
    },
    appendProps: true,
  })
}

async function getPresetConfig(url: string) {
  const prefix = "https://codesandbox.io/s/"
  const csbid = url.slice(prefix.length)
  const configUrl = `https://codesandbox.io/api/v1/sandboxes/${csbid}/sandpack`
  const res = await fetch(configUrl)
  return await res.json()
}
