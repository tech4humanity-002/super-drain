export const EXPECTED_SERVICE="t4h-super-drain";
export const EXPECTED_UI_MARKER="T4H SUPER_DRAIN";
export const EXPECTED_REPOSITORY="tech4humanity-002/super-drain";
export const EXPECTED_COMPONENT="super-drain";
export function validateRuntimeContract({rootText="",healthStatus=0,health=null,stateStatus=0,state=null,outtakeStatus=0,outtake=null}={}) {
  const stateView=state?.state,stateItems=stateView?.items,stateReturned=Number(stateView?.item_window?.returned??stateItems?.length),stateTotal=Number(stateView?.item_window?.total??state?.snapshot?.items??stateReturned),stateLimit=Number(stateView?.item_window?.limit??50);
  const checks={root_marker:String(rootText).includes(EXPECTED_UI_MARKER),health_200:Number(healthStatus)===200,health_service:health?.service===EXPECTED_SERVICE,health_status_real:health?.status==="REAL",health_repository:health?.source?.repository===EXPECTED_REPOSITORY,health_component:health?.source?.component===EXPECTED_COMPONENT,state_200:Number(stateStatus)===200,state_shape:Array.isArray(stateItems)&&Number.isFinite(stateReturned)&&Number.isFinite(stateTotal)&&Number.isFinite(stateLimit),state_bounded:Array.isArray(stateItems)&&stateLimit<=50&&stateItems.length<=stateLimit&&stateReturned===stateItems.length&&stateTotal>=stateReturned,outtake_200:Number(outtakeStatus)===200,outtake_shape:Array.isArray(outtake?.work)&&Number.isFinite(Number(outtake?.recovered_work))};
  const failures=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  return {status:failures.length?"BLOCKED":"REAL",canonical_runtime:failures.length===0,checks,failures};
}
