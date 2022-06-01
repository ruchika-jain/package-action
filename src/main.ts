import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {wait} from './wait'
import * as docker from './docker';
import * as oras from './oras';

async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
    
    const TOKEN = core.getInput('token'); 
    core.setSecret(TOKEN);
    const repo_owner_and_name: string[2] = core.getInput('repository')
    const repository_owner: string = core.getInput('repository_owner')
    
    const standalone = !(await oras.isAvailable());

    if (standalone) {
      core.info(`Oras info skipped in standalone mode`);
    } else {
      await exec.exec('oras', ['version'], {
        failOnStdErr: false
      });
    }
    if (!(await buildx.isAvailable(standalone))) {
      core.setFailed(`Docker buildx is required. See https://github.com/docker/setup-buildx-action to set up buildx.`);
      return;
    }
    
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
