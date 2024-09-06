import { Avatar, Select, SelectItem } from "@nextui-org/react";
import { Dispatch, SetStateAction } from "react";
import { models, voices } from "../context/WebScoket";

const arrayOfVoices = Object.entries(voices).map((e) => ({
  ...e[1],
  model: e[0],
}));

const itemClasses = {
  base: [
    "rounded-md",
    "text-default-500",
    "transition-opacity",
    "data-[hover=true]:text-foreground",
    "data-[hover=true]:bg-default-100",
    "data-[hover=true]:bg-default-50",
    "data-[selectable=true]:focus:bg-default-50",
    "data-[pressed=true]:opacity-70",
    "data-[focus-visible=true]:ring-default-500",
  ],
};

const classNames = {
  base: "before:bg-default-200",
  content: "p-0 border-small border-divider bg-background",
};

export const VoiceSelection = ({
  model,
  setVoice,
}: {
  model: string;
  setVoice: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <Select
      defaultSelectedKeys={["aura-model-asteria"]}
      selectedKeys={[model]}
      onSelectionChange={(keys: any) =>
        setVoice(keys.entries().next().value[0])
      }
      items={arrayOfVoices}
      label="Selected voice"
      color="default"
      variant="bordered"
      classNames={{
        label: "group-data-[filled=true]:-translate-y-5",
        trigger: "min-h-unit-16",
        listboxWrapper: "max-h-[400px]",
      }}
      listboxProps={{
        itemClasses,
      }}
      popoverProps={{
        classNames,
      }}
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <Avatar
              alt={item.data?.name}
              className="flex-shrink-0"
              size="sm"
              src={item.data?.avatar}
            />
            <div className="flex flex-col">
              <span>{item.data?.name}</span>
              <span className="text-default-500 text-tiny">
                ({item.data?.model} - {item.data?.language} {item.data?.accent})
              </span>
            </div>
          </div>
        ));
      }}
    >
      {(model) => (
        <SelectItem key={model.model} textValue={model.model} color="default">
          <div className="flex gap-2 items-center">
            <Avatar
              alt={model.name}
              className="flex-shrink-0"
              size="sm"
              src={model.avatar}
            />
            <div className="flex flex-col">
              <span className="text-small">{model.name}</span>
              <span className="text-tiny text-default-400">
                {model.model} - {model.language} {model.accent}
              </span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  );
};

export const ModelSelection = ({
  model,
  setModel,
}: {
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <Select
      defaultSelectedKeys={["aura-model-asteria"]}
      selectedKeys={[model]}
      onSelectionChange={(keys: any) =>
        setModel(keys.entries().next().value[0])
      }
      items={models}
      label="Selected model"
      color="default"
      variant="bordered"
      classNames={{
        label: "group-data-[filled=true]:-translate-y-5",
        trigger: "min-h-unit-16",
        listboxWrapper: "max-h-[400px]",
      }}
      listboxProps={{
        itemClasses,
      }}
      popoverProps={{
        classNames,
      }}
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div className="flex flex-col">
              <span>{item.data?.name}</span>
              <span className="text-default-500 text-tiny">
                ({item.data?.value})
              </span>
            </div>
          </div>
        ));
      }}
    >
      {(model) => (
        <SelectItem key={model.value} textValue={model.value} color="default">
          <div className="flex gap-2 items-center">
            <div className="flex flex-col">
              <span className="text-small">{model.name}</span>
              <span className="text-tiny text-default-400">{model.value}</span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  );
};
