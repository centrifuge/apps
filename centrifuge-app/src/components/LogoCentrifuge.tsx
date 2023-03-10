import * as React from 'react'
import styled from 'styled-components'

const SVG = styled.svg`
  display: block;
  width: 100%;
  height: auto;
`

export const LogoCentrifugeText: React.FC<Omit<React.SVGProps<SVGSVGElement>, 'ref'>> = (props) => {
  return (
    <SVG
      {...props}
      width="139"
      height="42"
      viewBox="0 0 139 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <LogoMark />
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M36.5709 23.8904C37.247 23.3088 38.0718 23.0173 39.0455 23.0173C39.5683 23.0173 40.0233 23.1026 40.4114 23.2726C40.7988 23.4431 41.1187 23.6713 41.3713 23.9576C41.6237 24.2443 41.8083 24.5754 41.9259 24.9516C42.0429 25.3276 42.1017 25.7218 42.1017 26.1335H35.4486C35.5204 25.2203 35.8948 24.4726 36.5709 23.8904ZM42.5885 29.9483C42.2276 30.4679 41.7678 30.8751 41.2092 31.1704C40.65 31.466 39.965 31.6138 39.1537 31.6138C38.6847 31.6138 38.2341 31.5332 37.8015 31.372C37.3687 31.2108 36.9808 30.9916 36.6385 30.7138C36.2958 30.4364 36.0207 30.1051 35.8136 29.7199C35.6062 29.3349 35.4845 28.9098 35.4486 28.4439H45.3201C45.3378 28.3008 45.3472 28.1576 45.3472 28.014V27.5843C45.3472 26.4203 45.1891 25.404 44.8738 24.5351C44.5582 23.6667 44.1207 22.9414 43.5621 22.3592C43.0031 21.7775 42.3404 21.3384 41.5743 21.0429C40.8077 20.7474 39.9739 20.5996 39.0726 20.5996C38.0989 20.5996 37.1929 20.7655 36.3546 21.0967C35.5162 21.4282 34.7902 21.8938 34.1773 22.4936C33.5642 23.0938 33.082 23.8191 32.7305 24.6694C32.3788 25.5203 32.2031 26.4652 32.2031 27.5036C32.2031 28.5605 32.3788 29.5049 32.7305 30.3377C33.082 31.1704 33.5689 31.8735 34.1909 32.4466C34.8129 33.0199 35.5474 33.4631 36.395 33.7763C37.2425 34.0894 38.1709 34.2465 39.1807 34.2465C41.3602 34.2465 43.0766 33.5567 44.331 32.1782L42.5885 29.9483Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M47.4006 20.9758H50.4837V23.0442H50.5379C50.8261 22.3995 51.3264 21.8311 52.0388 21.3384C52.7509 20.8461 53.594 20.5996 54.5676 20.5996C55.4149 20.5996 56.1404 20.7474 56.7447 21.043C57.3487 21.3384 57.8443 21.728 58.2321 22.2114C58.6197 22.6951 58.9038 23.2504 59.0841 23.877C59.2641 24.5041 59.3546 25.1488 59.3546 25.8112V33.8703H56.1091V26.7246C56.1091 26.3485 56.0821 25.9547 56.028 25.5425C55.9739 25.1309 55.8565 24.7593 55.6765 24.4278C55.496 24.0966 55.2479 23.8233 54.9326 23.6085C54.617 23.3935 54.1977 23.286 53.6751 23.286C53.152 23.286 52.7014 23.3893 52.3229 23.595C51.9442 23.801 51.6331 24.0651 51.3898 24.3875C51.1464 24.7098 50.9613 25.0818 50.8352 25.5022C50.709 25.9233 50.646 26.3485 50.646 26.7784V33.8703H47.4006V20.9758Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.7336 23.5543V20.9753H63.0054V17.2412H66.1967V20.9753H69.4422V23.5543H66.1967V29.5448C66.1967 30.1181 66.3003 30.5925 66.5078 30.9686C66.7149 31.3447 67.1792 31.5327 67.9006 31.5327C68.117 31.5327 68.3511 31.5105 68.6038 31.4656C68.8561 31.4211 69.0813 31.3539 69.28 31.264L69.3881 33.7892C69.0995 33.8967 68.7567 33.9815 68.3604 34.0445C67.9636 34.107 67.585 34.1385 67.2245 34.1385C66.359 34.1385 65.6559 34.0177 65.115 33.7758C64.574 33.534 64.1455 33.2029 63.8303 32.7818C63.5147 32.3614 63.2983 31.8777 63.1812 31.3312C63.0637 30.7852 63.0054 30.1987 63.0054 29.5716V23.5543H60.7336Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M71.3899 20.9758H74.5001V23.1248H74.5542C74.9145 22.3726 75.4197 21.7641 76.0687 21.2981C76.7177 20.8326 77.475 20.5996 78.3405 20.5996C78.4664 20.5996 78.6016 20.6042 78.7462 20.613C78.8903 20.6223 79.0166 20.6446 79.1248 20.6802V23.6353C78.9083 23.5816 78.7233 23.5459 78.5704 23.5279C78.4169 23.5101 78.2682 23.501 78.124 23.501C77.3846 23.501 76.7895 23.6353 76.3392 23.9038C75.8882 24.1725 75.5367 24.4948 75.2844 24.871C75.0316 25.2472 74.8606 25.6324 74.7706 26.0262C74.6801 26.4203 74.6353 26.7337 74.6353 26.9663V33.8703H71.3899V20.9758Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M80.6117 33.8705H83.8571V20.976H80.6117V33.8705ZM80.1519 16.5972C80.1519 16.078 80.3454 15.6259 80.7332 15.2406C81.1208 14.8556 81.6122 14.6631 82.2074 14.6631C82.8023 14.6631 83.3026 14.8468 83.7083 15.2138C84.114 15.581 84.3168 16.0423 84.3168 16.5972C84.3168 17.1524 84.114 17.6139 83.7083 17.9806C83.3026 18.348 82.8023 18.5314 82.2074 18.5314C81.6122 18.5314 81.1208 18.3392 80.7332 17.9538C80.3454 17.5689 80.1519 17.1168 80.1519 16.5972Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M88.0497 23.5543H85.5886V20.9754H88.0497V20.0111C88.0497 19.2413 88.1351 18.5026 88.3067 17.7949C88.4779 17.0876 88.7664 16.465 89.1722 15.9278C89.5778 15.3906 90.1141 14.9653 90.7814 14.6518C91.4481 14.3387 92.2865 14.1816 93.2966 14.1816C93.6569 14.1816 93.9592 14.1951 94.2026 14.2219C94.4459 14.2488 94.6936 14.2984 94.9464 14.3697L94.7299 17.1098C94.5495 17.0561 94.3556 17.0117 94.1485 16.9755C93.941 16.9398 93.7199 16.9218 93.4858 16.9218C93.0168 16.9218 92.6382 17.0117 92.35 17.1905C92.0613 17.3696 91.8404 17.6026 91.6874 17.8889C91.5339 18.1755 91.4304 18.4891 91.3763 18.8292C91.3222 19.1695 91.2951 19.5007 91.2951 19.823V20.9754H94.2971V23.5543H91.2951V33.8699H88.0497V23.5543Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M107.874 33.8701H104.791V31.8017H104.737C104.449 32.4464 103.948 33.0151 103.236 33.5074C102.524 33.9998 101.681 34.2463 100.707 34.2463C99.8597 34.2463 99.1341 34.0985 98.5303 33.8029C97.926 33.5074 97.4303 33.1179 97.0427 32.6345C96.6548 32.1508 96.3708 31.596 96.1908 30.9689C96.0104 30.3421 95.9204 29.6974 95.9204 29.0347V20.9756H99.1659V28.1213C99.1659 28.4974 99.1929 28.8915 99.247 29.3034C99.3011 29.7155 99.4181 30.087 99.5985 30.4181C99.7785 30.7498 100.027 31.0225 100.342 31.2374C100.657 31.4524 101.077 31.5599 101.6 31.5599C102.104 31.5599 102.551 31.457 102.939 31.2509C103.326 31.0452 103.642 30.7809 103.885 30.4584C104.129 30.1361 104.313 29.7646 104.44 29.3437C104.566 28.923 104.629 28.4974 104.629 28.0675V20.9756H107.874V33.8701Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M120.394 28.8687C120.214 29.3597 119.957 29.7925 119.623 30.1674C119.289 30.5421 118.884 30.841 118.406 31.0642C117.928 31.2876 117.392 31.3988 116.797 31.3988C116.22 31.3988 115.702 31.2831 115.242 31.0508C114.782 30.8188 114.394 30.5107 114.079 30.127C113.763 29.7433 113.52 29.3102 113.349 28.8283C113.177 28.3465 113.092 27.847 113.092 27.329C113.092 26.7582 113.177 26.2226 113.349 25.7226C113.52 25.2227 113.763 24.7899 114.079 24.424C114.394 24.0579 114.782 23.7679 115.242 23.5537C115.702 23.3397 116.229 23.2323 116.824 23.2323C117.419 23.2323 117.951 23.3397 118.42 23.5537C118.889 23.7679 119.289 24.0625 119.623 24.4374C119.957 24.8123 120.214 25.2495 120.394 25.749C120.574 26.249 120.665 26.7758 120.665 27.329C120.665 27.8646 120.574 28.378 120.394 28.8687ZM120.665 20.9758V22.9098H120.61C120.141 22.122 119.511 21.5398 118.717 21.1639C117.924 20.7877 117.068 20.5996 116.148 20.5996C115.174 20.5996 114.295 20.7789 113.511 21.137C112.727 21.4954 112.06 21.9789 111.51 22.5876C110.96 23.1966 110.536 23.9131 110.239 24.7366C109.941 25.5606 109.792 26.4383 109.792 27.3693C109.792 28.2827 109.945 29.147 110.252 29.9616C110.559 30.7768 110.987 31.4887 111.537 32.0972C112.087 32.7063 112.758 33.1899 113.552 33.5479C114.345 33.9059 115.228 34.0852 116.202 34.0852C117.104 34.0852 117.92 33.9178 118.65 33.5832C119.38 33.2486 119.979 32.7647 120.448 32.1313H120.502V33.0749C120.502 33.7222 120.435 34.3152 120.3 34.8545C120.164 35.3935 119.939 35.8611 119.623 36.2565C119.308 36.6519 118.884 36.9617 118.352 37.1867C117.82 37.4112 117.167 37.5238 116.392 37.5238C115.58 37.5238 114.778 37.3667 113.984 37.0536C113.212 36.7484 112.516 36.3113 111.898 35.743L109.982 38.1954C110.396 38.5354 110.865 38.8401 111.388 39.1087C111.911 39.3773 112.456 39.601 113.024 39.7803C113.592 39.9591 114.169 40.0935 114.755 40.1832C115.341 40.2726 115.895 40.3175 116.418 40.3175C117.68 40.3175 118.772 40.1383 119.691 39.7803C120.61 39.4218 121.372 38.916 121.976 38.2625C122.58 37.6086 123.027 36.8118 123.315 35.8717C123.603 34.9314 123.748 33.8791 123.748 32.7151V20.9758H120.665Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M130.111 23.8904C130.787 23.3088 131.612 23.0173 132.585 23.0173C133.108 23.0173 133.563 23.1026 133.951 23.2726C134.339 23.4431 134.658 23.6713 134.911 23.9576C135.163 24.2443 135.348 24.5754 135.466 24.9516C135.583 25.3276 135.641 25.7218 135.641 26.1335H128.988C129.06 25.2203 129.435 24.4726 130.111 23.8904ZM136.128 29.9483C135.767 30.4679 135.308 30.8751 134.749 31.1704C134.19 31.466 133.505 31.6138 132.693 31.6138C132.224 31.6138 131.774 31.5332 131.341 31.372C130.908 31.2108 130.521 30.9916 130.178 30.7138C129.836 30.4364 129.56 30.1051 129.353 29.7199C129.146 29.3349 129.024 28.9098 128.988 28.4439H138.86C138.878 28.3008 138.887 28.1576 138.887 28.014V27.5843C138.887 26.4203 138.729 25.404 138.414 24.5351C138.098 23.6667 137.66 22.9414 137.102 22.3592C136.543 21.7775 135.88 21.3384 135.114 21.0429C134.347 20.7474 133.514 20.5996 132.612 20.5996C131.639 20.5996 130.733 20.7655 129.894 21.0967C129.056 21.4282 128.33 21.8938 127.717 22.4936C127.104 23.0938 126.622 23.8191 126.27 24.6694C125.919 25.5203 125.743 26.4652 125.743 27.5036C125.743 28.5605 125.919 29.5049 126.27 30.3377C126.622 31.1704 127.109 31.8735 127.731 32.4466C128.353 33.0199 129.087 33.4631 129.935 33.7763C130.782 34.0894 131.711 34.2465 132.721 34.2465C134.9 34.2465 136.616 33.5567 137.871 32.1782L136.128 29.9483Z"
          fill="black"
        />
      </g>
    </SVG>
  )
}

export const LogoCentrifuge: React.FC<Omit<React.SVGProps<SVGSVGElement>, 'ref'>> = (props) => {
  return (
    <SVG
      {...props}
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <LogoMark />
    </SVG>
  )
}

function LogoMark() {
  return (
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.96087 33.0512C3.7019 30.3741 2.99868 27.3874 2.99868 24.2376C2.99868 12.7225 12.3966 3.38776 23.9896 3.38776C30.4447 3.38776 36.2191 6.28215 40.0697 10.8354L42.3668 8.92086C37.9662 3.71707 31.3669 0.40918 23.9896 0.40918C10.7405 0.40918 0 11.0775 0 24.2376C0 27.8374 0.803648 31.2508 2.24249 34.3103L4.96087 33.0512Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.9896 38.3861C16.123 38.3861 9.7458 32.0518 9.7458 24.238C9.7458 16.4242 16.123 10.0899 23.9896 10.0899C28.3699 10.0899 32.2876 12.0544 34.9005 15.1442L37.1982 13.2291C34.0353 9.4889 29.292 7.11133 23.9896 7.11133C14.4668 7.11133 6.74707 14.7792 6.74707 24.238C6.74707 33.6968 14.4668 41.3647 23.9896 41.3647V38.3861Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.1578 28.5448C27.9202 30.0084 26.0644 30.9389 23.9895 30.9389C20.2632 30.9389 17.2424 27.9385 17.2424 24.2372C17.2424 20.5359 20.2632 17.5354 23.9895 17.5354C26.0644 17.5354 27.9202 18.466 29.1578 19.9296L31.742 17.7758C29.8855 15.5805 27.1018 14.1846 23.9895 14.1846C18.4 14.1846 13.8689 18.6853 13.8689 24.2372C13.8689 29.7891 18.4 34.2898 23.9895 34.2898C26.8418 34.2898 29.4175 33.1169 31.257 31.2312L29.1578 28.5448Z"
        fill="black"
      />
    </g>
  )
}
