import { useEffect, useState } from "react";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ContractPromise, CodePromise,Abi } from "@polkadot/api-contract";
import abi from "../../flipper/target/ink/metadata.json";
import contract_file from "../flipper.contract.json";
import { numberToHex,BN } from '@polkadot/util';

const Home = () => {
  const [block, setBlock] = useState(0);
  const [lastBlockHash, setLastBlockHash] = useState("");
  const [blockchainUrl, setBlockchainUrl] = useState("ws://127.0.0.1:9944");
  const [api, setApi] = useState<any>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [actingAddress, setActingAddress] = useState("");
  const [result, setResult] = useState("");
  const [gasConsumed, setGasConsumed] = useState("");
  const [outcome, setOutcome] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  const extensionSetup = async () => {
    const { web3Accounts, web3Enable } = await import(
      "@polkadot/extension-dapp"
    );
    const extensions = await web3Enable("Polk4NET");
    if (extensions.length === 0) {
      return;
    }
    const account = await web3Accounts();
    setAccounts(account);
  };

  const setup = async () => {
    const wsProvider = new WsProvider(blockchainUrl);
    const api = await ApiPromise.create({ provider: wsProvider });
    setApi(api);
    await extensionSetup();
  };

  
  const gasLimitValue = 100000 * 1000000;
  const gasLimit_1 = numberToHex(21000);
  const storageDepositLimit = null;


  const deployContract = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);
    const contractWasm = contract_file.source.wasm;
    const code = new CodePromise(api, abi, contractWasm);
    const initValue = false;
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);
    
    console.log("### pass 1");

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });

    const tx = code.tx.new({ value:0, gasLimit:gasLimit , storageDepositLimit }, 
      initValue,
      performingAccount.address
      );

    console.log("### pass 2");

    let address = "";
    const unsub = await tx.signAndSend(
      actingAddress,
      { signer: injector.signer },
      ({  contract , status, events = [] }) => {
        if (status.isInBlock) {
          console.log("### in block : contract:",contract);
          setResult("in a block");
        } else if (status.isFinalized) {
          events.forEach(({ event: { data } }) => {
            console.log("### data.methhod:", data.method);
            if (String(data.method) == "ExtrinsicFailed") {
              console.log("### check ExtrinsicFailed");
              alert("Transaction Failed.");
            }
          });
          console.log("### finalized : contract:",contract);
          setResult("finalized");
          address = contract.address.toString();
          setContractAddress(address);
          //api.disconnect();
          unsub();
        }
      }
    );
  };

  const getFlipValueOnlyOwner = async () => {
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    const contract = new ContractPromise(api, abi, contractAddress);
    //setApi(api);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });
  
    const { gasConsumed, result, output } = await contract.query.getOnlyOwner(
      actingAddress,
      { value: 0, gasLimit: gasLimit }
    );
    setGasConsumed(gasConsumed.toHuman());
    setResult(JSON.stringify(result.toHuman()));
    if (output !== undefined && output !== null) {
      setOutcome(output.toHuman()?.toString() ?? "");
    }
    //api.disconnect();
  };

  const getFlipValue = async () => {
    const contract = new ContractPromise(api, abi, contractAddress);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });
  
    const { gasConsumed, result, output } = await contract.query.get(
      actingAddress,
      { value: 0, gasLimit: gasLimit, storageDepositLimit }
    );
      console.log("### gasConsumed:",gasConsumed.toHuman().toString());
      console.log("### result:",result.toHuman());

    if (output !== undefined && output !== null) {
      console.log("### output:",output.toHuman().Ok);
      setOutcome(output.toHuman().Ok.toString());
    }
    //api.disconnect();
  };

  const changeFlipValue = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });
  
    const { gasRequired, gasConsumed ,result, output } = await contract.query.flip(
      actingAddress,
      { value: 0, gasLimit: gasLimit,storageDepositLimit },
      
    );

    console.log("### gasRequired:",gasRequired.toHuman().toString());
    console.log("### gasConsumed:",gasConsumed.toHuman().toString());

    const flip = await contract.tx.flip({ value: 0, gasLimit: gasRequired,storageDepositLimit });
    if (injector !== undefined) {
      const unsub = await flip.signAndSend(actingAddress, { signer: injector.signer }, ( { status, events = [] } ) => {
        if (status.isInBlock) {
          setResult("in a block");
        } else if (status.isFinalized) {
          setResult("finalized");
          events.forEach(({ event: { data } }) => {
            console.log("### data.methhod:", data.method);
            if (String(data.method) == "ExtrinsicFailed") {
              console.log("### check ExtrinsicFailed");
              alert("Transaction Failed.");
            }
          });
          unsub();
          //api.disconnect();
        }
      });
    }
  };

  const add_test_data = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });  

    const { gasRequired, gasConsumed ,result, output } = await contract.query.addTestData(
      { value: 0, gasLimit: gasLimit,storageDepositLimit },
      actingAddress,
      0
    );

    const flip = await contract.tx.addTestData(
      { value: 0, gasLimit: gasLimitValue },
      actingAddress,
      0
    );
    if (injector !== undefined) {
      const unsub = await flip.signAndSend(actingAddress, { signer: injector.signer }, ( { status, events = [] }) => {
        if (status.isInBlock) {
          setResult("in a block");
        } else if (status.isFinalized) {
          setResult("finalized");
          events.forEach(({ event: { data } }) => {
            console.log("### data.methhod:", data.method);
            if (String(data.method) == "ExtrinsicFailed") {
              console.log("### check ExtrinsicFailed");
              alert("Transaction Failed.");
            }
          });

          unsub();
          
        }
      });
    }
  };

  const own_error_test = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });  

    const { gasRequired, gasConsumed ,result, output } = await contract.query.ownErrorTest(
      actingAddress,
      { value: 0, gasLimit: gasLimit,storageDepositLimit },
      actingAddress,
      0      
    );

    console.log("### result of dry run ###" );
    console.log("### output:", output?.toHuman());
    console.log("### result:", result.toHuman());

   if (output?.toHuman()?.Ok.Err != undefined) {
    if ( output?.toHuman()?.Ok.Err.Custom == "ThisIsTest"){
    alert("I can handle errors");
    return;
   }
  }

    const flip = await contract.tx.ownErrorTest(
      { value: 0, gasLimit: gasRequired },
      actingAddress,
      0
    );
    if (injector !== undefined) {
      const unsub = await flip.signAndSend(actingAddress, { signer: injector.signer }, ({ events = [], status } ) => {
        if (status.isInBlock) {
          setResult("in a block");
        } else if (status.isFinalized) {
          setResult("finalized");
          events.forEach(({ event}) => {
            if (api.events.contracts.ContractEmitted.is(event)) {
              console.log("### event.data:",event.data);
              const [account_id, contract_evt] = event.data;
              const decoded = new Abi(abi).decodeEvent(contract_evt);
              console.log("### decoded:", decoded);
              console.log("### decoded.args[2]:",decoded.args[2].toHuman()?.toString());
            }
            console.log("### data.methhod:",event.data.method);
            if (event.data.method == "ExtrinsicFailed"){
              alert("Transaction is failure.");
            }
          });
          unsub();
          //api.disconnect();
        }
        //console.log("###result: ",status);
      });
    }
  };

  const get_test_data = async () => {
    const contract = new ContractPromise(api, abi, contractAddress);

    const gasLimit: any = api.registry.createType("WeightV2", {
      refTime: new BN("10000000000"),
      proofSize: new BN("10000000000"),
    });
  
    const { gasConsumed, result, output } = await contract.query.getTestList(
      actingAddress,
      { value: 0, gasLimit: gasLimit },
      0
    );
    setGasConsumed(gasConsumed.toHuman());
    setResult(JSON.stringify(result.toHuman()));
    if (output !== undefined && output !== null) {
      const response_json = output.toJSON();
      const json_data = JSON.parse(JSON.stringify(response_json));
      let result: string = "";
      console.log("response_json:", response_json);
      console.log("json_data:", json_data);
      console.log("json_data length:", json_data.length);

      console.log("# pass 1");

      for (let i = 0; i < json_data.length; i++) {
        console.log("# pass 2");
        let tmp = json_data[i].tokenAddress;
        console.log("tmp:", tmp);
        result = result + tmp + ",";
        let tmp2 = json_data[i].tokenType;
        console.log("tmp2:", tmp2);
        result = result + tmp2 + ",";
      }

      console.log("result:", result);
      const result2 = result;
      setOutcome(result2);
    }
  };

  return (
    <>
      <div className="text-center">
      <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          onClick={setup}
        >
          Setup Account
        </button>
        <div className="p-5"></div>        

        <div className="p-3 m-3 text-3xl">flipper test</div>
        <div className="p-3 m-3">Block: {block}</div>
        <div className="p-3 m-3">Blockchain URL: {blockchainUrl}</div>
        <div className="">Custom Blockchain URL</div>
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          onClick={setup}
        >
          Change Blockchain URL
        </button>
        <input
          className="p-2 m-2 border-2"
          onChange={(event) => setBlockchainUrl(event.target.value)}
        />
        <br />
        <div className="p-3 m-3">Last block hash: {lastBlockHash}</div>
        <div className="p-5"></div>
        <div className="">
          Acting account (select from dropdown):{" "}
          {actingAddress ? actingAddress : "..."}
        </div>
        <br />
        <select
          className="p-3 m-3 border-2 border-green-500"
          onChange={(event) => {
            console.log(event);
            setActingAddress(event.target.value);
          }}
        >
          {accounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.address} [{a.meta.name}]
            </option>
          ))}
        </select>
        <br />
        <div className="p-3 m-3">
          <button
            className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
            onClick={deployContract}
          >
            deploy flipper contract
          </button>
          <label> contract address is : {contractAddress}</label>
        </div>
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={getFlipValue}
        >
          {api && contractAddress
            ? "Get flip value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={getFlipValueOnlyOwner}
        >
          {api && contractAddress
            ? "Get flip value! (Only Owner)"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={get_test_data}
        >
          {api && contractAddress
            ? "Get test value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={changeFlipValue}
        >
          {api && contractAddress
            ? "Change flip value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={add_test_data}
        >
          {api && contractAddress
            ? "add test value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={own_error_test}
        >
          {api && contractAddress
            ? "own error test"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <div>Result: {result}</div>
        <div>Outcome: {outcome}</div>
        <div>Gas consumed: {gasConsumed}</div>
      </div>
    </>
  );
};

export default Home;
