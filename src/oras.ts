import * as exec from '@actions/exec';

export async function isAvailable(): Promise<boolean> {
  // return await exec
  //   .getExecOutput('oras', ['version'], {
  //     ignoreReturnCode: true,
  //     silent: true
  //   })
  //   .then(res => {
  //     if (res.stderr.length > 0 && res.exitCode !== 0) {
  //       return false;
  //     }
  //     return res.exitCode === 0;
  //   })
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   .catch(error => {
  //     return false;
  //   });
  try{
    const res = await exec
              .getExecOutput('oras', ['version'], {
                ignoreReturnCode: true,
                silent: true
              })
    if (res.stderr.length > 0 && res.exitCode !== 0) {
            return false;
    }
    return res.exitCode === 0;
  } catch ( err ) {
    return false;
  }
}
