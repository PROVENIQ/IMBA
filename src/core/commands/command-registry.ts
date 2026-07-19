import { assertNoPlaintextPii } from "../pii/pii-reference";
import type {
  CommandId,
  CorrelationId,
  CausationId,
} from "../primitives/identity";
import type { JsonObject } from "../primitives/json";

export interface CommandEnvelope {
  readonly commandId: CommandId;
  readonly commandType: string;
  readonly schemaVersion: number;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly requestedAt: string;
  readonly payload: JsonObject;
}

export interface CommandDefinition {
  readonly commandType: string;
  readonly schemaVersion: number;
  readonly validate: (payload: Readonly<JsonObject>) => void;
}

export class CommandRegistry {
  readonly #definitions = new Map<string, CommandDefinition>();

  register(definition: CommandDefinition): void {
    if (this.#definitions.has(definition.commandType)) {
      throw new Error(`command type already registered: ${definition.commandType}`);
    }
    if (!Number.isSafeInteger(definition.schemaVersion) || definition.schemaVersion <= 0) {
      throw new TypeError("command schemaVersion must be a positive integer");
    }
    this.#definitions.set(definition.commandType, Object.freeze({ ...definition }));
  }

  validate(command: CommandEnvelope): CommandEnvelope {
    const definition = this.#definitions.get(command.commandType);
    if (!definition) {
      throw new Error(`unrecognized command type: ${command.commandType}`);
    }
    if (command.schemaVersion !== definition.schemaVersion) {
      throw new Error(
        `unsupported ${command.commandType} command schema v${command.schemaVersion}; expected v${definition.schemaVersion}`,
      );
    }

    assertNoPlaintextPii(command.payload);
    definition.validate(command.payload);
    return Object.freeze({
      ...command,
      payload: structuredClone(command.payload),
    });
  }
}
