import { CogIcon } from "./icons/CogIcon";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@nextui-org/react";
import { useDeepgram, voiceMap, voices } from "../context/Deepgram";
import { Dispatch, SetStateAction, useState } from "react";
import { useToast } from "../context/Toast";

const arrayOfVoices = Object.entries(voices).map((e) => ({
  ...e[1],
  model: e[0],
}));

const ModelSelection = ({
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
        itemClasses: {
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
        },
      }}
      popoverProps={{
        classNames: {
          base: "before:bg-default-200",
          content: "p-0 border-small border-divider bg-background",
        },
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

export const Settings = () => {
  const { toast } = useToast();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { ttsOptions, setTtsOptions } = useDeepgram();

  const [model, setModel] = useState<string>(ttsOptions?.model as string);

  return (
    <>
      <div className="flex items-center gap-2.5 text-sm">
        <span className="bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded-full flex">
          <a
            className={`relative m-px bg-black md:w-[9.25rem] w-10 h-10 rounded-full text-sm p-2.5 group md:hover:w-[9.25rem] transition-all ease-in-out duration-1000 overflow-hidden whitespace-nowrap`}
            href="#"
            onClick={onOpen}
          >
            <CogIcon className="w-5 h-5 transition-transform ease-in-out duration-2000 group-hover:rotate-180" />
            <span className="ml-2.5 text-xs">Change settings</span>
          </a>
        </span>
        <span className="hidden md:inline-block text-white/50 font-inter">
          Voice:{" "}
          <span className="text-white">
            {voiceMap(ttsOptions?.model as string).name}
          </span>
        </span>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        className="glass"
      >
        <ModalContent>
          {(onClose) => {
            const saveAndClose = () => {
              setTtsOptions({ ...ttsOptions, model });

              toast("Options saved.");

              onClose();
            };

            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Settings
                </ModalHeader>
                <ModalBody>
                  <h2>Text-to-Speech Settings</h2>
                  <ModelSelection model={model} setModel={setModel} />
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={saveAndClose}>
                    Save
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};

// <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>;
