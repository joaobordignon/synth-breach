// The exact solution command(s) per episode, in order. Used only by the
// `stuck` command (unlocked after `intel 3`) to drop the next command into the
// player's prompt — the explicit "I give up" escape hatch. Everything else
// keeps the puzzle intact: goals, `--help`, and the tiered `intel` hints.

export const SOLUTIONS: Record<number, string[]> = {
  0: ["help", "codex", "accept-code"],
  1: ["netmap 10.42.0.0/24", "ping 10.42.0.1"],
  2: ["portscan --inspect 10.42.0.1", "answer 8088"],
  3: ["banner-grab --target 10.42.0.1 --port 80", "inspect --protocol http"],
  4: [
    'decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="',
    'hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"',
  ],
  5: [
    'cipher-crack --type caesar --text "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD"',
    'xor-decrypt --stream "0x53 0x59 0x4E" --key 0x42',
  ],
  6: [
    "hash-identify 21232f297a57a5a743894a0e4a801fc3",
    "crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist synth_rockyou.txt",
  ],
  7: [
    "trace --pattern caught-cell-01 --compare hex-contact-log",
    "vulnscan --host 10.42.20.10",
    'searchsploit "ProFTPD 1.3.3c"',
  ],
  8: ["use exploit/unix/ftp/proftpd_backdoor", "set RHOST 10.42.20.10", "set PAYLOAD cmd/unix/reverse", "exploit"],
  9: ["enumerate", "find / -perm -u=s -type f", "strings /opt/aether/bin/system-backup", "priv-esc --vector path-hijack"],
  10: ["proxy-intercept --target cloud.aetherdyn.internal", 'inject-sql --payload "admin\' OR \'1\'=\'1\' --"'],
  11: ["api-probe --endpoint /user/profile", "tamper --param user_id=0001"],
  12: ["fetch-file --path ../../../../etc/aether/master_key.pem", "verify-key A", "bounty-report --compile"],
};

// Deliberately absurd ways to admit defeat (the `stuck` flag).
export const GIVE_UP_FLAGS = [
  "--terminatorgotme",
  "--imgoingtobedafterthisone",
  "--skynetwins",
  "--hexcarryme",
  "--iamjustahuman",
  "--bluepillplease",
];
