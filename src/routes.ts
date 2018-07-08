import * as execa from "execa";
import * as inflection from "inflection";
import { workspace } from "vscode";

const LINE_REGEXP = /(\w+)?\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+?)(?:\(\.:format\))?\s+([^#]+)#(\w+)/;
const PARAM_REGEXP = /:\w+/;

interface Route {
  methods: Set<string>;
  actions: Set<string>;
  url: string;
  params: string[];
  controller: string;
}

// TODO: refactor
const parse = (output: string): Map<string, Route> => {
  const matchesArray = output
    .split("\n")
    .map(line => line.match(LINE_REGEXP))
    .filter(matches => matches !== null) as RegExpMatchArray[];

  const routesArray = matchesArray
    .map(([, helper, method, url, controller, action]) => ({
      helper,
      method,
      url,
      controller,
      action
    }))
    .reduce((arr: any[], { helper, method, url, controller, action }) => {
      const prevRoute = arr[arr.length - 1];
      // NOTE: PATCH, PUT, DELETE
      if (
        prevRoute &&
        prevRoute.controller === controller &&
        prevRoute.actions.has(action)
      ) {
        return arr;
      }

      if (!helper) {
        if (!prevRoute) {
          return arr;
        }
        prevRoute.actions.add(action);
        prevRoute.methods.add(method);
        return arr.slice(0, -1).concat(prevRoute);
      }

      const lastController = controller.split("/").pop() as string;
      const route = {
        methods: new Set([method]),
        actions: new Set([action]),
        params: url
          // NOTE: scope params
          .replace(/[()]/g, "")
          .split("/")
          .filter(part => part.match(PARAM_REGEXP))
          .map(part =>
            part
              .replace(":", "")
              .replace(/_id$/g, "")
              .replace(/^id$/g, inflection.singularize(lastController))
          ),
        helper,
        url,
        controller
      };

      return [...arr, route];
    }, [])
    .map(({ helper, methods, actions, url, params, controller }) => [
      helper,
      { methods, actions, url, params, controller }
    ]) as [string, Route][];

  return new Map(routesArray);
};

export default class Routes {
  private routes: Map<string, Route> = new Map();
  private process?: execa.ExecaChildProcess | null;

  constructor(private rootPath: string) {}

  /**
   * dispose
   */
  public dispose() {
    this.routes.clear();
  }

  /**
   * load
   */
  public async load() {
    const output = await this.exec();
    this.routes.clear();
    this.routes = parse(output);
  }

  /**
   * getAll
   */
  public getAll() {
    return this.routes;
  }

  /**
   * get
   */
  public get(helper: string) {
    return this.routes.get(helper);
  }

  private async exec() {
    if (this.process) {
      this.process.kill();
    }

    const rakeCommand: string = workspace.getConfiguration("railsRoutes")
      .rakeCommand;
    const [command, ...args] = rakeCommand.split(/\s+/);

    this.process = execa(command, [...args, "routes"], {
      cwd: this.rootPath
    });

    const { stdout } = await this.process;
    this.process = null;
    return stdout;
  }
}
